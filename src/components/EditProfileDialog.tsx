import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileBasicInfoSchema, educationSchema, experienceSchema, skillSchema, achievementSchema } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Trophy, Award, Star, Medal, Target, Zap, Crown, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ACHIEVEMENT_ICONS = [
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "award", label: "Award", icon: Award },
  { value: "star", label: "Star", icon: Star },
  { value: "medal", label: "Medal", icon: Medal },
  { value: "target", label: "Target", icon: Target },
  { value: "zap", label: "Lightning", icon: Zap },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "heart", label: "Heart", icon: Heart },
];

const getIconComponent = (iconName: string) => {
  const iconItem = ACHIEVEMENT_ICONS.find(i => i.value === iconName);
  return iconItem?.icon || Trophy;
};

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  education: any[];
  experience: any[];
  skills: any[];
  achievements: any[];
}

export const EditProfileDialog = ({ open, onOpenChange, profile, education, experience, skills, achievements }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Basic Info Form
  const basicForm = useForm<z.infer<typeof profileBasicInfoSchema>>({
    resolver: zodResolver(profileBasicInfoSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      company: profile?.company || "",
    },
  });

  // Education Forms
  const [educationEntries, setEducationEntries] = useState(education || []);
  const [newEducation, setNewEducation] = useState({ institution: "", degree: "", period: "" });

  // Experience Forms
  const [experienceEntries, setExperienceEntries] = useState(experience || []);
  const [newExperience, setNewExperience] = useState({ company: "", position: "", description: "", period: "" });

  // Skills Forms
  const [skillEntries, setSkillEntries] = useState(skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Achievements Forms
  const [newAchievement, setNewAchievement] = useState({ title: "", description: "", icon: "trophy" });

  // Fetch skill suggestions from database
  const fetchSkillSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSkillSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("skills")
        .select("skill_name")
        .ilike("skill_name", `%${query}%`)
        .limit(5);

      if (error) throw error;

      // Get unique skill names
      const uniqueSkills = [...new Set(data.map(s => s.skill_name))];
      setSkillSuggestions(uniqueSkills);
      setShowSuggestions(uniqueSkills.length > 0);
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
    }
  };

  const handleBasicInfoSubmit = async (data: z.infer<typeof profileBasicInfoSchema>) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          bio: data.bio || null,
          location: data.location || null,
          company: data.company || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEducation = async () => {
    if (!user || !newEducation.institution.trim()) return;

    try {
      const validated = educationSchema.parse(newEducation);
      
      const { error } = await supabase
        .from("education")
        .insert({
          user_id: user.id,
          institution: validated.institution,
          degree: validated.degree || null,
          period: validated.period || null,
        });

      if (error) throw error;

      toast.success("Education added successfully");
      setNewEducation({ institution: "", degree: "", period: "" });
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to add education");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("education")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Education deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete education");
    }
  };

  const handleAddExperience = async () => {
    if (!user || !newExperience.company.trim() || !newExperience.position.trim()) return;

    try {
      const validated = experienceSchema.parse(newExperience);
      
      const { error } = await supabase
        .from("experience")
        .insert({
          user_id: user.id,
          company: validated.company,
          position: validated.position,
          description: validated.description || null,
          period: validated.period || null,
        });

      if (error) throw error;

      toast.success("Experience added successfully");
      setNewExperience({ company: "", position: "", description: "", period: "" });
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to add experience");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const { error } = await supabase
        .from("experience")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Experience deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete experience");
    }
  };

  const handleAddSkill = async () => {
    if (!user || !newSkill.trim()) return;

    // Check max 20 skills limit (FR-PROFILE-002 requirement)
    if (skills.length >= 20) {
      toast.error("Maximum 20 skills allowed");
      return;
    }

    try {
      const validated = skillSchema.parse({ skill_name: newSkill });
      
      const { error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          skill_name: validated.skill_name,
        });

      if (error) throw error;

      toast.success("Skill added successfully");
      setNewSkill("");
      setShowSuggestions(false);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to add skill");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Skill deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete skill");
    }
  };

  const handleAddAchievement = async () => {
    if (!user || !newAchievement.title.trim()) return;

    try {
      const validated = achievementSchema.parse(newAchievement);
      
      const { error } = await supabase
        .from("achievements")
        .insert({
          user_id: user.id,
          title: validated.title,
          description: validated.description || null,
          icon: validated.icon || "trophy",
        });

      if (error) throw error;

      toast.success("Achievement added successfully");
      setNewAchievement({ title: "", description: "", icon: "trophy" });
      queryClient.invalidateQueries({ queryKey: ["user-achievements", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to add achievement");
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Achievement deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["user-achievements", user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete achievement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information, education, experience, skills, and achievements
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <form onSubmit={basicForm.handleSubmit(handleBasicInfoSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...basicForm.register("full_name")}
                  placeholder="Your full name"
                />
                {basicForm.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{basicForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...basicForm.register("bio")}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
                {basicForm.formState.errors.bio && (
                  <p className="text-sm text-destructive">{basicForm.formState.errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...basicForm.register("location")}
                  placeholder="City, Country"
                />
                {basicForm.formState.errors.location && (
                  <p className="text-sm text-destructive">{basicForm.formState.errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  {...basicForm.register("company")}
                  placeholder="Your current company"
                />
                {basicForm.formState.errors.company && (
                  <p className="text-sm text-destructive">{basicForm.formState.errors.company.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Basic Info
              </Button>
            </form>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            {/* Existing Education */}
            {education.map((edu) => (
              <Card key={edu.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{edu.institution}</CardTitle>
                      {edu.degree && <CardDescription>{edu.degree}</CardDescription>}
                      {edu.period && <p className="text-xs text-muted-foreground mt-1">{edu.period}</p>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteEducation(edu.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {/* Add New Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edu_institution">Institution *</Label>
                  <Input
                    id="edu_institution"
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                    placeholder="University or School"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edu_degree">Degree</Label>
                  <Input
                    id="edu_degree"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                    placeholder="e.g., Bachelor of Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edu_period">Period</Label>
                  <Input
                    id="edu_period"
                    value={newEducation.period}
                    onChange={(e) => setNewEducation({ ...newEducation, period: e.target.value })}
                    placeholder="e.g., 2018 - 2022"
                  />
                </div>
                <Button onClick={handleAddEducation} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Education
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            {/* Existing Experience */}
            {experience.map((exp) => (
              <Card key={exp.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{exp.position}</CardTitle>
                      <CardDescription>{exp.company}</CardDescription>
                      {exp.period && <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>}
                      {exp.description && <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteExperience(exp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {/* Add New Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exp_company">Company *</Label>
                  <Input
                    id="exp_company"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_position">Position *</Label>
                  <Input
                    id="exp_position"
                    value={newExperience.position}
                    onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                    placeholder="Job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_description">Description</Label>
                  <Textarea
                    id="exp_description"
                    value={newExperience.description}
                    onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                    placeholder="Describe your role and achievements..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_period">Period</Label>
                  <Input
                    id="exp_period"
                    value={newExperience.period}
                    onChange={(e) => setNewExperience({ ...newExperience, period: e.target.value })}
                    placeholder="e.g., Jan 2020 - Present"
                  />
                </div>
                <Button onClick={handleAddExperience} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Experience
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            {/* Existing Skills */}
            {skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full"
                      >
                        <span className="text-sm">{skill.skill_name}</span>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add New Skill */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Skill {skills.length >= 20 && "(Limit Reached)"}
                </CardTitle>
                {skills.length >= 20 && (
                  <p className="text-sm text-destructive mt-1">
                    Maximum 20 skills allowed. Delete a skill to add a new one.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="skill_name">Skill Name *</Label>
                  <Input
                    id="skill_name"
                    value={newSkill}
                    onChange={(e) => {
                      setNewSkill(e.target.value);
                      fetchSkillSuggestions(e.target.value);
                    }}
                    onFocus={() => newSkill.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="e.g., JavaScript, Project Management"
                    disabled={skills.length >= 20}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  {/* Auto-suggest dropdown (FR-PROFILE-002 requirement) */}
                  {showSuggestions && skillSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                      {skillSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                          onClick={() => {
                            setNewSkill(suggestion);
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleAddSkill} 
                  className="w-full"
                  disabled={skills.length >= 20}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skill
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            {/* Existing Achievements */}
            {achievements.map((achievement) => {
              const IconComponent = getIconComponent(achievement.icon || "trophy");
              return (
                <Card key={achievement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{achievement.title}</CardTitle>
                          {achievement.description && (
                            <CardDescription>{achievement.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteAchievement(achievement.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}

            {/* Add New Achievement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Achievement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="achievement_title">Title *</Label>
                  <Input
                    id="achievement_title"
                    value={newAchievement.title}
                    onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                    placeholder="e.g., Dean's List, Best Innovation Award"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement_description">Description</Label>
                  <Textarea
                    id="achievement_description"
                    value={newAchievement.description}
                    onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                    placeholder="Brief description of your achievement..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement_icon">Icon</Label>
                  <Select
                    value={newAchievement.icon}
                    onValueChange={(value) => setNewAchievement({ ...newAchievement, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACHIEVEMENT_ICONS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SelectItem key={item.value} value={item.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddAchievement} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Achievement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
