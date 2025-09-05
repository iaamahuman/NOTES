import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { 
  Upload as UploadIcon, FileText, Image, File, X, CheckCircle, 
  AlertCircle, Info, Camera, Paperclip, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/components/protected-route";
import { uploadNote } from "@/lib/api";

const uploadSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  subject: z.string().min(1, "Please select a subject"),
  course: z.string().optional(),
  professor: z.string().optional(),
  semester: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type UploadForm = z.infer<typeof uploadSchema>;

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Engineering", "Psychology", "Philosophy", "History", "Literature",
  "Economics", "Business", "Medicine", "Law", "Art", "Music"
];

const semesters = [
  "Fall 2024", "Spring 2024", "Summer 2024", "Fall 2023", "Spring 2023"
];

interface FileUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      isPublic: true,
    },
  });

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");

  const validateAndSetFile = (file: File) => {
    // File size check (25MB limit - increased from 10MB)
    if (file.size > 25 * 1024 * 1024) {
      setFileState(prev => ({
        ...prev,
        error: "File size must be less than 25MB"
      }));
      return false;
    }

    // Enhanced file type check
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/markdown',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'md', 'doc', 'docx', 'ppt', 'pptx'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      setFileState(prev => ({
        ...prev,
        error: "Supported file types: PDF, Images (JPG, PNG, GIF, WebP), Text (TXT, MD), Documents (DOC, DOCX), Presentations (PPT, PPTX)"
      }));
      return false;
    }

    // Create preview for images
    let preview: string | null = null;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setFileState({
      file,
      preview,
      uploading: false,
      progress: 0,
      error: null,
    });

    // Auto-fill title if empty
    if (!watchedTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setValue("title", nameWithoutExt);
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const clearFile = () => {
    if (fileState.preview) {
      URL.revokeObjectURL(fileState.preview);
    }
    setFileState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null,
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-600" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-red-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: UploadForm) => {
    if (!fileState.file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setFileState(prev => ({ ...prev, uploading: true, progress: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', fileState.file);
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('subject', data.subject);
      if (data.course) formData.append('course', data.course);
      if (data.professor) formData.append('professor', data.professor);
      if (data.semester) formData.append('semester', data.semester);
      if (data.tags) formData.append('tags', data.tags);
      formData.append('isPublic', data.isPublic.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFileState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await uploadNote(formData);

      clearInterval(progressInterval);
      setFileState(prev => ({ ...prev, progress: 100 }));

      toast({
        title: "Upload successful!",
        description: "Your note has been uploaded and is now available to the community.",
      });

      // Redirect to the note detail page
      setTimeout(() => {
        setLocation(`/notes/${result.id}`);
      }, 1000);

    } catch (error) {
      setFileState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed"
      }));

      toast({
        title: "Upload failed",
        description: "There was an error uploading your note. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Knowledge</h1>
            <p className="text-gray-600">Upload your study notes to help fellow students succeed</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!fileState.file ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-all duration-200 cursor-pointer group"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                      <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
                      <p className="text-gray-600 mb-4">
                        Support for PDF, Images, Documents (DOC, PPT), Text files, and more
                      </p>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.doc,.docx,.ppt,.pptx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button type="button" className="mb-2 pointer-events-none">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                      <p className="text-sm text-gray-500">Maximum file size: 25MB</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* File Preview */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getFileIcon(fileState.file.type)}
                            <div>
                              <p className="font-medium">{fileState.file.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatFileSize(fileState.file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFile}
                            disabled={fileState.uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {fileState.preview && (
                          <div className="mt-4">
                            <img
                              src={fileState.preview}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg border"
                            />
                          </div>
                        )}

                        {fileState.uploading && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Uploading...</span>
                              <span className="text-sm text-gray-600">{fileState.progress}%</span>
                            </div>
                            <Progress value={fileState.progress} />
                          </div>
                        )}
                      </div>

                      {fileState.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{fileState.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Note Details Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Note Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter a descriptive title for your notes"
                          {...register("title")}
                        />
                        {errors.title && (
                          <p className="text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Select onValueChange={(value) => setValue("subject", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.subject && (
                          <p className="text-sm text-red-600">{errors.subject.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Input
                          id="course"
                          placeholder="e.g., MATH 101"
                          {...register("course")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="professor">Professor</Label>
                        <Input
                          id="professor"
                          placeholder="Professor name"
                          {...register("professor")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select onValueChange={(value) => setValue("semester", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {semesters.map(semester => (
                              <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what these notes cover and any important details"
                          rows={4}
                          {...register("description")}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Optional but recommended for better discoverability</span>
                          <span>{watchedDescription?.length || 0}/500</span>
                        </div>
                        {errors.description && (
                          <p className="text-sm text-red-600">{errors.description.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          placeholder="calculus, integration, derivatives (comma separated)"
                          {...register("tags")}
                        />
                        <p className="text-xs text-gray-500">
                          Add tags to help others find your notes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        {...register("isPublic")}
                        defaultChecked={true}
                      />
                      <Label htmlFor="isPublic" className="text-sm">
                        Make this note publicly available
                      </Label>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={!fileState.file || fileState.uploading}
                        className="flex-1"
                      >
                        {fileState.uploading ? (
                          <>
                            <UploadIcon className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <UploadIcon className="h-4 w-4 mr-2" />
                            Upload Note
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/browse")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Tips Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Upload Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">📝 Good Titles</h4>
                    <p className="text-sm text-gray-600">
                      Be specific and descriptive. "Calculus Integration Techniques" is better than "Math Notes"
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">📚 File Quality</h4>
                    <p className="text-sm text-gray-600">
                      Upload clear, readable files. PDF format is preferred for text-heavy notes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">🏷️ Tags Help</h4>
                    <p className="text-sm text-gray-600">
                      Use relevant tags to make your notes discoverable by others
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">⭐ Get Featured</h4>
                    <p className="text-sm text-gray-600">
                      High-quality notes with good descriptions get featured and more downloads
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <p>• Only upload your own original work</p>
                  <p>• Respect copyright and fair use policies</p>
                  <p>• Keep content appropriate and academic</p>
                  <p>• No spam or irrelevant content</p>
                  <p>• Help others by providing quality notes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
