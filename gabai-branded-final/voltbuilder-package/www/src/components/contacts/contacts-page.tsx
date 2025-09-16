import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Download, Phone, Mail, Building, MapPin, Calendar, ArrowLeft, Home, Edit, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";

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
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/contacts", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.getContacts(user!.id),
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: (contact: Omit<Contact, 'id' | 'createdAt'>) => 
      api.createContact({ ...contact, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", user?.id] });
      setEditingContact(null);
      toast({
        title: "Contact Created",
        description: "New contact has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create contact.",
        variant: "destructive",
      });
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: (contact: Contact) => api.updateContact(contact.id, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", user?.id] });
      setEditingContact(null);
      toast({
        title: "Contact Updated",
        description: "Contact has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update contact.",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => api.deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", user?.id] });
      setDeletingContact(null);
      toast({
        title: "Contact Deleted",
        description: "Contact has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete contact.",
        variant: "destructive",
      });
    },
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

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2" data-testid="back-button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>Contacts</span>
          </h1>
        </div>
        <Button
          onClick={() => setEditingContact({ 
            id: '', firstName: '', lastName: '', company: '', jobTitle: '', 
            email: '', phone: '', website: '', address: '', notes: '', 
            source: 'manual', createdAt: new Date().toISOString() 
          })}
          className="flex items-center space-x-2"
          data-testid="add-contact-button"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-24" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {isLoading ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>Loading your contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start building your network by adding contacts or scanning business cards.
              </p>
              <Button 
                onClick={() => setEditingContact({ 
                  id: '', firstName: '', lastName: '', company: '', jobTitle: '', 
                  email: '', phone: '', website: '', address: '', notes: '', 
                  source: 'manual', createdAt: new Date().toISOString() 
                })}
                className="mx-auto"
              >
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow" data-testid={`contact-card-${contact.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-500" />
                      <span>{[contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed Contact'}</span>
                    </CardTitle>
                    {contact.company && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Building className="h-4 w-4" />
                        <span>{contact.company}</span>
                        {contact.jobTitle && <span> - {contact.jobTitle}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingContact(contact)}
                      data-testid={`edit-contact-${contact.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingContact(contact)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`delete-contact-${contact.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{contact.address}</span>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{contact.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    {contact.source && (
                      <Badge variant="secondary" className="text-xs">
                        {contact.source}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadVCard(contact.id, [contact.firstName, contact.lastName].filter(Boolean).join(' '))}
                    data-testid={`download-vcard-${contact.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNav />
      </div>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingContact.id ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editingContact.firstName || ''}
                    onChange={(e) => setEditingContact({...editingContact, firstName: e.target.value})}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editingContact.lastName || ''}
                    onChange={(e) => setEditingContact({...editingContact, lastName: e.target.value})}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editingContact.phone || ''}
                  onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editingContact.company || ''}
                  onChange={(e) => setEditingContact({...editingContact, company: e.target.value})}
                  data-testid="input-company"
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={editingContact.jobTitle || ''}
                  onChange={(e) => setEditingContact({...editingContact, jobTitle: e.target.value})}
                  data-testid="input-job-title"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={editingContact.address || ''}
                  onChange={(e) => setEditingContact({...editingContact, address: e.target.value})}
                  data-testid="input-address"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingContact.notes || ''}
                  onChange={(e) => setEditingContact({...editingContact, notes: e.target.value})}
                  data-testid="input-notes"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setEditingContact(null)} data-testid="cancel-edit">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingContact.id) {
                    updateContactMutation.mutate(editingContact);
                  } else {
                    const { id, createdAt, ...contactData } = editingContact;
                    createContactMutation.mutate(contactData);
                  }
                }}
                disabled={updateContactMutation.isPending || createContactMutation.isPending}
                data-testid="save-contact"
              >
                {(updateContactMutation.isPending || createContactMutation.isPending) ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingContact && (
        <Dialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete {[deletingContact.firstName, deletingContact.lastName].filter(Boolean).join(' ')}? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDeletingContact(null)} data-testid="cancel-delete">
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteContactMutation.mutate(deletingContact.id)}
                disabled={deleteContactMutation.isPending}
                data-testid="confirm-delete"
              >
                {deleteContactMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}