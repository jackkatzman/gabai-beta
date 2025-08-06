import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Download, Phone, Mail, Building, MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  source?: string;
  createdAt: string;
}

export function ContactsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/contacts", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.getContacts(user!.id),
  });

  const downloadVCard = async (contactId: string, contactName: string) => {
    try {
      api.downloadVCard(contactId);
      toast({
        title: "VCard Downloaded",
        description: `Contact card for ${contactName} has been downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>Loading your contacts...</p>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Contacts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Start by uploading business cards or images with contact information in the OCR section.
              </p>
              <Badge variant="secondary">Business cards will automatically create contacts</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Your Contacts</span>
              <Badge variant="outline">{contacts.length}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact: Contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header with Name and Download */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">
                          {contact.firstName || contact.lastName 
                            ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                            : 'Contact'
                          }
                        </h3>
                        {contact.jobTitle && contact.company && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {contact.jobTitle} at {contact.company}
                          </p>
                        )}
                        {contact.jobTitle && !contact.company && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {contact.jobTitle}
                          </p>
                        )}
                        {!contact.jobTitle && contact.company && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {contact.company}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVCard(
                          contact.id,
                          `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact'
                        )}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      
                      {contact.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      
                      {contact.company && !contact.jobTitle && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{contact.company}</span>
                        </div>
                      )}
                      
                      {contact.address && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{contact.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                      </div>
                      {contact.source === 'business_card' && (
                        <Badge variant="secondary" className="text-xs">
                          Business Card
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}