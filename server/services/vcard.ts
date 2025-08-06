import type { Contact } from "@shared/schema";

export function generateVCard(contact: Contact): string {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    contact.firstName ? `N:${contact.lastName || ''};${contact.firstName};;;` : '',
    contact.company ? `ORG:${contact.company}` : '',
    contact.jobTitle ? `TITLE:${contact.jobTitle}` : '',
    contact.email ? `EMAIL:${contact.email}` : '',
    contact.phone ? `TEL:${contact.phone}` : '',
    contact.website ? `URL:${contact.website}` : '',
    contact.address ? `ADR:;;${contact.address};;;;` : '',
    contact.notes ? `NOTE:${contact.notes}` : '',
    'PRODID:GabAi Contact Manager',
    'END:VCARD'
  ].filter(line => line && !line.endsWith(':')).join('\r\n');

  return vcard;
}

export function extractContactFromText(text: string): Partial<Contact> {
  const contact: Partial<Contact> = {
    originalOcrText: text,
    source: 'business_card'
  };

  // Extract name (usually first few lines or in larger text)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Name patterns - look for lines with multiple words that aren't email/phone/address
  const namePattern = /^[A-Za-z\s.]{2,40}$/;
  const possibleNames = lines.filter(line => 
    namePattern.test(line) && 
    !line.includes('@') && 
    !line.match(/\d{3}/) && 
    !line.toLowerCase().includes('llc') &&
    !line.toLowerCase().includes('inc') &&
    !line.toLowerCase().includes('corp')
  );

  if (possibleNames.length > 0) {
    const fullName = possibleNames[0].split(' ');
    contact.firstName = fullName[0];
    if (fullName.length > 1) {
      contact.lastName = fullName.slice(1).join(' ');
    }
  }

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }

  // Extract phone number
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) {
    contact.phone = phoneMatch[0];
  }

  // Extract company - look for lines with business words or after name
  const companyKeywords = ['llc', 'inc', 'corp', 'ltd', 'company', 'group', 'associates', 'partners'];
  const companyLine = lines.find(line => 
    companyKeywords.some(keyword => line.toLowerCase().includes(keyword)) ||
    (line.length > 3 && line.length < 50 && !line.includes('@') && !line.match(/\d{3}/))
  );
  
  if (companyLine && companyLine !== `${contact.firstName} ${contact.lastName}`.trim()) {
    contact.company = companyLine;
  }

  // Extract job title - look for professional titles
  const titleKeywords = ['manager', 'director', 'president', 'ceo', 'cto', 'cfo', 'vp', 'vice president', 'senior', 'lead', 'head', 'chief', 'founder', 'owner', 'consultant', 'specialist', 'coordinator', 'supervisor', 'analyst', 'engineer', 'developer', 'designer'];
  const titleLine = lines.find(line => 
    titleKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  
  if (titleLine) {
    contact.jobTitle = titleLine;
  }

  // Extract website
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+/);
  if (websiteMatch && !websiteMatch[0].includes('@')) {
    contact.website = websiteMatch[0].startsWith('http') ? websiteMatch[0] : `https://${websiteMatch[0]}`;
  }

  // Extract address - usually longer lines with address components
  const addressPattern = /\d+.*?(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)/i;
  const addressLine = lines.find(line => addressPattern.test(line));
  if (addressLine) {
    contact.address = addressLine;
  }

  return contact;
}