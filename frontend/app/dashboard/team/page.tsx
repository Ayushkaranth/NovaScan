"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  MoreVertical,
  User,
  Mail,
  Briefcase,
  Hash,
  UserCog,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

// Standard UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import api from "@/lib/api";

export default function TeamPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("Admin"); // Get from auth context
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog States
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    project: ""
  });

  // Add member form state
  const [addMemberForm, setAddMemberForm] = useState({
    name: "",
    email: "",
    role: "Employee",
    project: ""
  });

  // Predefined roles for the organization
  const allRoles = [
    "Admin",
    "Manager", 
    "HR",
    "Employee",
   
  ];

  useEffect(() => {
    fetchMembers();
    fetchProjects();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // Fetch current user's role from API
      const res = await api.get("/organizations/me");
      const userRole = res.data.role || "Admin";
      setCurrentUserRole(userRole);
      console.log("Current user role:", userRole); // Debug log
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      // Default to Admin if fetch fails
      setCurrentUserRole("Admin");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get("/organizations/members/list");
      console.log("Members API response:", res.data); // Debug log
      setMembers(res.data.members || []);
      
      // If no members, show a helpful message
      if (!res.data.members || res.data.members.length === 0) {
        console.log("No members found in the response");
      }
    } catch (err: any) {
      console.error("Failed to fetch members:", err);
      console.error("Error details:", err.response?.data); // More detailed error
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to fetch team members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(Array.isArray(res.data) ? res.data : (res.data.projects || []));
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  // Apply Search and Dropdown Filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member._id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.employee_id || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || (member.role || "").toLowerCase() === roleFilter.toLowerCase();
    const matchesProject = projectFilter === "all" || (member.projects || []).some((project: any) => project.name === projectFilter);

    return matchesSearch && matchesRole && matchesProject;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, projectFilter, pageSize]);

  // Action Handlers
  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setViewDialogOpen(true);
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name || "",
      email: member.email || "",
      role: member.role || "",
      project: member.project || ""
    });
    setEditDialogOpen(true);
  };

  const handleDeleteMember = (member: any) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const handleAddMember = () => {
    setAddMemberForm({
      name: "",
      email: "",
      role: "Employee",
      project: ""
    });
    setAddMemberDialogOpen(true);
  };

  const confirmAddMember = async () => {
    // Validate form
    if (!addMemberForm.name || !addMemberForm.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Backend expects: { email, name, role }
      await api.post("/organizations/members", {
        email: addMemberForm.email,
        name: addMemberForm.name,
        role: addMemberForm.role.toLowerCase() // Backend expects lowercase
      });
      
      toast({
        title: "Success",
        description: `${addMemberForm.name} has been added to the team`
      });
      setAddMemberDialogOpen(false);
      fetchMembers(); // Refresh the list
    } catch (err: any) {
      console.error("Failed to add member:", err);
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to add member",
        variant: "destructive"
      });
    }
  };

  const confirmEditMember = async () => {
    try {
      await api.put(`/organizations/members/${selectedMember._id}`, editForm);
      toast({
        title: "Success",
        description: "Member updated successfully"
      });
      setEditDialogOpen(false);
      fetchMembers(); // Refresh the list
    } catch (err) {
      console.error("Failed to update member:", err);
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive"
      });
    }
  };

  const confirmDeleteMember = async () => {
    try {
      await api.delete(`/organizations/members/${selectedMember._id}`);
      toast({
        title: "Success",
        description: "Member removed successfully"
      });
      setDeleteDialogOpen(false);
      fetchMembers(); // Refresh the list
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  // Helper to check if user can perform actions
  const canEdit = () => {
    const role = currentUserRole.toLowerCase();
    return role === "admin" || role === "hr";
  };

  const canDelete = () => {
    const role = currentUserRole.toLowerCase();
    return role === "admin" || role === "hr";
  };

  const canViewOnly = () => {
    const role = currentUserRole.toLowerCase();
    return role === "manager" || role === "employee" || role === "viewer";
  };

  // Helper to colorize badges based on roles - now returns colored div styling
  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return {
          bg: "bg-black dark:bg-white",
          text: "text-white dark:text-black",
          border: "border-slate-300 dark:border-slate-700"
        };
      case "developer":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          text: "text-purple-700 dark:text-purple-400",
          border: "border-purple-400 dark:border-purple-600"
        };
      case "designer":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/20",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-400 dark:border-amber-600"
        };
      case "manager":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          text: "text-blue-700 dark:text-blue-400",
          border: "border-blue-400 dark:border-blue-600"
        };
      case "hr":
        return {
          bg: "bg-rose-50 dark:bg-rose-900/20",
          text: "text-rose-700 dark:text-rose-400",
          border: "border-rose-400 dark:border-rose-600"
        };
      case "employee":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-900/20",
          text: "text-cyan-700 dark:text-cyan-400",
          border: "border-cyan-400 dark:border-cyan-600"
        };
      case "viewer":
        return {
          bg: "bg-gray-50 dark:bg-gray-900/20",
          text: "text-gray-700 dark:text-gray-400",
          border: "border-gray-400 dark:border-gray-600"
        };
      default:
        return {
          bg: "bg-zinc-50 dark:bg-zinc-900/20",
          text: "text-zinc-700 dark:text-zinc-400",
          border: "border-zinc-400 dark:border-zinc-600"
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-1.5">
            Manage your team members and their access
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
              Your role: {currentUserRole}
            </span>
            {canViewOnly() && (
              <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                View-only access
              </span>
            )}
          </p>
        </div>
        {canEdit() && (
          <Button className="gap-2 text-white dark:text-black dark:bg-white" onClick={handleAddMember}>
            <Users className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card/50 backdrop-blur-sm p-4 rounded-lg border">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or ID..."
            className="pl-9 bg-background/50 border-border/50 focus:bg-background w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border/50">
              <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project.name}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background/50 border-border/50">
              <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  Employee ID
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Name
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Project
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Role
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member, index) => (
                <TableRow 
                  key={member._id} 
                  className="group hover:bg-muted/30 transition-colors"
                >
                  {/* Employee ID */}
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {member.employee_id || `#${member._id?.slice(-6).toUpperCase() || `EMP${String(startIndex + index + 1).padStart(3, '0')}`}`}
                  </TableCell>

                  {/* Name with Avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage src={member.profile_image || member.avatar} alt={member.name || member.email} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                          {(member.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {member.name || member.email || "Unknown User"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {member.email || "No email"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Project */}
                  <TableCell>
                    <span className="text-sm font-medium">
                      {member.projects?.length ? member.projects.map((project: any) => project.name).join(", ") : "—"}
                    </span>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <div 
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-medium border ${getRoleBadgeStyle(member.role).bg} ${getRoleBadgeStyle(member.role).text} ${getRoleBadgeStyle(member.role).border}`}
                    >
                      {(member.role || "Member").replace(/^./, (value: string) => value.toUpperCase())}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* View Profile - Available to all roles */}
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleViewMember(member)}
                        >
                          <Eye className="mr-2 w-4 h-4" />
                          View Profile
                        </DropdownMenuItem>

                        {/* Edit Details - Only for Admin and HR */}
                        {canEdit() && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleEditMember(member)}
                          >
                            <Pencil className="mr-2 w-4 h-4" />
                            Edit Details
                          </DropdownMenuItem>
                        )}

                        {/* Change Role - Only for Admin and HR */}
                        {canEdit() && (
                          <DropdownMenuItem className="cursor-pointer">
                            <UserCog className="mr-2 w-4 h-4" />
                            Change Role
                          </DropdownMenuItem>
                        )}

                        {/* Remove Member - Only for Admin and HR */}
                        {canDelete() && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <Trash2 className="mr-2 w-4 h-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No members found</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {filteredMembers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>
              of <span className="font-medium text-foreground">{filteredMembers.length}</span> member{filteredMembers.length !== 1 && 's'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium">{currentPage}</span>
              <span className="text-muted-foreground">of</span>
              <span className="font-medium">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Member Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogDescription>
              View detailed information about this team member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-background shadow-lg">
                  <AvatarImage src={selectedMember.profile_image || selectedMember.avatar} alt={selectedMember.name || selectedMember.email} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xl">
                    {(selectedMember.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMember.name || "Name not set"}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Employee ID
                  </div>
                  <div className="col-span-2 text-sm font-mono">
                    {selectedMember.employee_id || `#${selectedMember._id?.slice(-6).toUpperCase()}`}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Role
                  </div>
                  <div className="col-span-2">
                    <div 
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-medium border ${getRoleBadgeStyle(selectedMember.role).bg} ${getRoleBadgeStyle(selectedMember.role).text} ${getRoleBadgeStyle(selectedMember.role).border}`}
                    >
                      {(selectedMember.role || "Member").replace(/^./, (value: string) => value.toUpperCase())}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Projects
                  </div>
                  <div className="col-span-2 text-sm">
                    {selectedMember.projects?.length ? selectedMember.projects.map((project: any) => project.name).join(", ") : "Not assigned"}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">Organization</div>
                  <div className="col-span-2 text-sm">{selectedMember.organization_name || "—"}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information and assignments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-project">Project</Label>
              <Select
                value={editForm.project || "none"}
                onValueChange={(value) => setEditForm({ ...editForm, project: value === "none" ? "" : value })}
              >
                <SelectTrigger id="edit-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEditMember}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from your organization?
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {(selectedMember.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                This action cannot be undone. The member will lose access to all projects and data.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMember}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Invite a new team member to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-name"
                value={addMemberForm.name}
                onChange={(e) => setAddMemberForm({ ...addMemberForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-email"
                type="email"
                value={addMemberForm.email}
                onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select
                value={addMemberForm.role}
                onValueChange={(value) => setAddMemberForm({ ...addMemberForm, role: value })}
              >
                <SelectTrigger id="add-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-project">Project (Optional)</Label>
              <Select
                value={addMemberForm.project || "none"}
                onValueChange={(value) => setAddMemberForm({ ...addMemberForm, project: value === "none" ? "" : value })}
              >
                <SelectTrigger id="add-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddMember}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
