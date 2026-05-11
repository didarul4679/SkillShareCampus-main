import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Pencil, LogOut, Camera, Trophy, Award, Star, Medal } from "lucide-react";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRef, useState } from "react";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { FriendSuggestions } from "@/components/FriendSuggestions";
import { ProfileCompletenessWidget } from "@/components/ProfileCompletenessWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppHeader } from "@/components/AppHeader";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { CoverImageCropper } from "@/components/CoverImageCropper";
import { ProfileRecentPosts } from "@/components/ProfileRecentPosts";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, education, skills, experience, achievements, friendCount, isLoading, uploadAvatar, uploadCoverImage } = useUserProfile(user?.id);
  const { unreadCount } = useNotifications();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>("");

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    try {
      await uploadAvatar.mutateAsync(file);
      setAvatarPreviewUrl(null);
    } catch (error) {
      setAvatarPreviewUrl(null);
      // Error is handled in the mutation
    }
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImageSrc(imageUrl);
    setCropperOpen(true);
    
    // Reset file input so the same file can be selected again
    event.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    console.log("Crop complete, blob size:", croppedBlob.size);
    setCropperOpen(false);
    
    // Show preview
    const previewUrl = URL.createObjectURL(croppedBlob);
    setCoverPreviewUrl(previewUrl);
    
    // Convert blob to file
    const croppedFile = new File([croppedBlob], "cover.jpg", { type: "image/jpeg" });
    console.log("Uploading cropped file:", croppedFile.name, croppedFile.size);
    
    // Upload cropped image
    try {
      await uploadCoverImage.mutateAsync(croppedFile);
      console.log("Cover upload successful");
      setCoverPreviewUrl(null);
    } catch (error) {
      console.error("Cover upload error:", error);
      setCoverPreviewUrl(null);
      // Error is handled in the mutation
    } finally {
      // Clean up object URLs
      URL.revokeObjectURL(cropperImageSrc);
    }
  };

  const handleAvatarClick = () => {
    avatarFileInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverFileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OfflineBanner />
      {/* Header */}
      <AppHeader currentPage="profile" />

      {/* Main Content */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <EmailVerificationBanner />
          <ErrorBoundary fallbackMessage="Unable to load profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80 rounded-t-lg overflow-hidden">
                    {coverPreviewUrl || profile?.cover_image_url ? (
                      <img 
                        src={coverPreviewUrl || profile?.cover_image_url || ""} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white text-4xl font-bold">WEB</div>
                        </div>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800')] bg-cover bg-center opacity-60"></div>
                      </>
                    )}
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleCoverFileChange}
                      className="hidden"
                    />
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute top-3 right-3 rounded-full"
                      onClick={handleCoverClick}
                      disabled={uploadCoverImage.isPending}
                    >
                      {uploadCoverImage.isPending ? (
                        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Profile Info */}
                  <div className="px-6 pb-6">
                    <div className="relative -mt-16 mb-4">
                      <UserAvatar
                        avatarUrl={avatarPreviewUrl || profile?.avatar_url}
                        fullName={profile?.full_name}
                        email={user?.email}
                        className="h-32 w-32 border-4 border-background text-4xl"
                      />
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                        onClick={handleAvatarClick}
                        disabled={uploadAvatar.isPending}
                      >
                        {uploadAvatar.isPending ? (
                          <div className="h-3 w-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">
                        {profile?.full_name || user?.email || "User"}
                      </h2>
                      {profile?.bio && (
                        <p className="text-sm text-muted-foreground">{profile.bio}</p>
                      )}
                      {profile?.location && (
                        <p className="text-xs text-muted-foreground">{profile.location}</p>
                      )}
                      {profile?.company && (
                        <p className="text-xs text-muted-foreground">{profile.company}</p>
                      )}
                      <p className="text-sm text-primary font-medium">{friendCount} connections</p>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button variant="default" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" onClick={signOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Log Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Posts Section */}
              <ProfileRecentPosts userId={user?.id} />

              {profile?.bio && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">About</h3>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Education Section */}
              {education && education.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">Education</h3>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {education.map((edu) => (
                        <div key={edu.id} className="border-l-2 border-primary pl-4">
                          <h4 className="font-semibold text-foreground">{edu.institution}</h4>
                          {edu.degree && <p className="text-sm text-muted-foreground">{edu.degree}</p>}
                          {edu.period && <p className="text-xs text-muted-foreground mt-1">{edu.period}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience Section */}
              {experience && experience.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">Experience</h3>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {experience.map((exp) => (
                        <div key={exp.id} className="border-l-2 border-primary pl-4">
                          <h4 className="font-semibold text-foreground">{exp.position}</h4>
                          <p className="text-sm text-primary">{exp.company}</p>
                          {exp.period && <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>}
                          {exp.description && <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills Section */}
              {skills && skills.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">Skills</h3>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary">
                          {skill.skill_name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Achievements Section */}
              {achievements && achievements.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">Achievements</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {achievements.map((achievement) => {
                        const IconComponent = 
                          achievement.icon === 'award' ? Award :
                          achievement.icon === 'star' ? Star :
                          achievement.icon === 'medal' ? Medal : Trophy;
                        
                        return (
                          <div key={achievement.id} className="flex flex-col items-center p-4 bg-accent/50 rounded-lg text-center">
                            <div className="p-3 bg-primary/10 rounded-full mb-2">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-medium text-sm text-foreground">{achievement.title}</h4>
                            {achievement.description && (
                              <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Completeness */}
              <ProfileCompletenessWidget 
                profile={profile}
                education={education}
                skills={skills}
                experience={experience}
              />

              {/* Friend Suggestions */}
              <FriendSuggestions />

              {/* Ad Card */}
              <Card>
                <CardContent className="p-0">
                  <img 
                    src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400" 
                    alt="Mindset Course"
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=NC" />
                        <AvatarFallback>NC</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Nijercart</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Visit: www.nijercart.com<br />
                      Mail: nijercart@gmail.com
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      অর্ডার করতে মেসেজে আসুন, অর্ডার নিতে মেসেজ করুন আমাদের,
                      Nijercart সবার জন্য একটা পরিবার ভাই বোনদের কথা ভেবে সহজ মূল্যে
                    </p>
                    <Button className="w-full" variant="default">Explore</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </ErrorBoundary>
        </div>
      </main>

      <Footer />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        education={education || []}
        experience={experience || []}
        skills={skills || []}
        achievements={achievements || []}
      />

      {/* Cover Image Cropper */}
      <CoverImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Profile;
