import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Users, Trash2, Edit, UserPlus, Phone, Crown, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Group, GroupMember } from "@shared/schema";

type GroupWithMembers = Group & { members: GroupMember[] };

export default function GroupsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  
  // Form states
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");

  // Fetch subscription status
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
  });

  // Fetch groups
  const { data: groups = [], isLoading } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("/api/groups", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setCreateDialogOpen(false);
      setGroupName("");
      setGroupDescription("");
      toast({
        title: "Success",
        description: "Group created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      return await apiRequest(`/api/groups/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setEditDialogOpen(false);
      setSelectedGroup(null);
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update group",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/groups/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    },
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/subscription/start-trial", "POST", { durationDays: 30 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({
        title: "Success",
        description: "Your 30-day free trial has started!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start trial",
        variant: "destructive",
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: { name: string; phone: string } }) => {
      return await apiRequest(`/api/groups/${groupId}/members`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setMemberDialogOpen(false);
      setMemberName("");
      setMemberPhone("");
      toast({
        title: "Success",
        description: "Member added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      return await apiRequest(`/api/groups/${groupId}/members/${memberId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription || undefined,
    });
  };

  const handleUpdateGroup = () => {
    if (!selectedGroup || !groupName.trim()) return;
    updateGroupMutation.mutate({
      id: selectedGroup.id,
      data: {
        name: groupName,
        description: groupDescription || undefined,
      },
    });
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm("Are you sure you want to delete this group? All members will be removed.")) {
      deleteGroupMutation.mutate(id);
    }
  };

  const handleAddMember = () => {
    if (!selectedGroup || !memberName.trim() || !memberPhone.trim()) return;
    addMemberMutation.mutate({
      groupId: selectedGroup.id,
      data: {
        name: memberName,
        phone: memberPhone,
      },
    });
  };

  const handleRemoveMember = (groupId: string, memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate({ groupId, memberId });
    }
  };

  const openEditDialog = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setEditDialogOpen(true);
  };

  const openMemberDialog = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setMemberName("");
    setMemberPhone("");
    setMemberDialogOpen(true);
  };

  if (isLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isPremium = (subscriptionStatus as any)?.isPremium || false;
  const trialEnded = (subscriptionStatus as any)?.trialEnded || false;
  const trialEndsAt = (subscriptionStatus as any)?.trialEndsAt;
  const subscriptionStatusValue = (subscriptionStatus as any)?.subscriptionStatus;
  
  // Calculate days remaining in trial
  const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-8 w-8" />
                Groups
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create groups to send reminders to multiple people
              </p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={!isPremium}
                data-testid="button-create-group"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a group to send reminders to multiple people at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Family, Team, Friends"
                    data-testid="input-group-name"
                  />
                </div>
                <div>
                  <Label htmlFor="group-description">Description (Optional)</Label>
                  <Input
                    id="group-description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Brief description of the group"
                    data-testid="input-group-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || createGroupMutation.isPending}
                  data-testid="button-submit-group"
                >
                  {createGroupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscription Status Card */}
        {isPremium && subscriptionStatusValue === 'trial' && trialEndsAt && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Free Trial Active</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining • Expires {new Date(trialEndsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                  $9/month after trial
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {isPremium && subscriptionStatusValue === 'active' && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Premium Active</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You have full access to group reminders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Status Alert */}
        {!isPremium && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Crown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-blue-900 dark:text-blue-100">
                {trialEnded ? (
                  <>Your trial has ended. Subscribe to continue using group reminders at $9/month.</>
                ) : (
                  <>Group reminders are a premium feature. Start your 30-day free trial to get started!</>
                )}
              </span>
              {!trialEnded && (
                <Button
                  onClick={() => startTrialMutation.mutate()}
                  disabled={startTrialMutation.isPending}
                  size="sm"
                  className="ml-4"
                  data-testid="button-start-trial"
                >
                  {startTrialMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Start Free Trial
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No groups yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Create your first group to start sending reminders to multiple people
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)} 
                disabled={!isPremium}
                data-testid="button-create-first-group"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Card key={group.id} data-testid={`card-group-${group.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span data-testid={`text-group-name-${group.id}`}>{group.name}</span>
                      </CardTitle>
                      {group.description && (
                        <CardDescription className="mt-1" data-testid={`text-group-description-${group.id}`}>
                          {group.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!isPremium}
                        onClick={() => openEditDialog(group)}
                        data-testid={`button-edit-group-${group.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!isPremium}
                        onClick={() => handleDeleteGroup(group.id)}
                        data-testid={`button-delete-group-${group.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Members ({group.members.length})
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isPremium}
                        onClick={() => openMemberDialog(group)}
                        data-testid={`button-add-member-${group.id}`}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                    {group.members.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No members yet. Add members to send group reminders.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            data-testid={`member-${member.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div>
                                <p 
                                  className="text-sm font-medium text-gray-900 dark:text-white"
                                  data-testid={`text-member-name-${member.id}`}
                                >
                                  {member.name}
                                </p>
                                <p 
                                  className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"
                                  data-testid={`text-member-phone-${member.id}`}
                                >
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!isPremium}
                              onClick={() => handleRemoveMember(group.id, member.id)}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Group Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>Update the group name and description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  data-testid="input-edit-group-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-group-description">Description (Optional)</Label>
                <Input
                  id="edit-group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  data-testid="input-edit-group-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdateGroup}
                disabled={!groupName.trim() || updateGroupMutation.isPending}
                data-testid="button-submit-edit-group"
              >
                {updateGroupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member to {selectedGroup?.name}</DialogTitle>
              <DialogDescription>
                Add a new member who will receive group reminders
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="member-name">Name</Label>
                <Input
                  id="member-name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Member's name"
                  data-testid="input-member-name"
                />
              </div>
              <div>
                <Label htmlFor="member-phone">Phone Number</Label>
                <Input
                  id="member-phone"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="+1234567890"
                  data-testid="input-member-phone"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddMember}
                disabled={!memberName.trim() || !memberPhone.trim() || addMemberMutation.isPending}
                data-testid="button-submit-member"
              >
                {addMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
