import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, CloudUpload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadNote } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface SelectedFile {
  file: File;
  id: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      subject: "",
      description: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadNote,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your notes have been uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/recent"] });
      onClose();
      setSelectedFiles([]);
      form.reset();
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload notes",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const onSubmit = (data: UploadForm) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    // For simplicity, we'll upload the first file
    const firstFile = selectedFiles[0];
    const formData = new FormData();
    formData.append('file', firstFile.file);
    formData.append('title', data.title);
    formData.append('subject', data.subject);
    if (data.description) {
      formData.append('description', data.description);
    }

    // Simulate progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate(formData);
  };

  const subjects = [
    "Mathematics",
    "Computer Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Literature",
    "History",
    "Economics",
    "Psychology",
    "Other",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="upload-modal">
        <DialogHeader>
          <DialogTitle>Upload Your Notes</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Drag and Drop Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-testid="upload-dropzone"
            >
              <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Drag and drop your files here
              </h4>
              <p className="text-gray-600 mb-4">Or click to browse your computer</p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files)}
                data-testid="file-input"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="choose-files-button"
              >
                Choose Files
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, JPG, PNG, TXT, DOC (Max 10MB each)
              </p>
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3" data-testid="selected-files">
                {selectedFiles.map((selectedFile) => (
                  <div
                    key={selectedFile.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    data-testid={`selected-file-${selectedFile.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-red-500">📄</div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(selectedFile.id)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`remove-file-${selectedFile.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Note Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a descriptive title"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a brief description of your notes to help other students..."
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2" data-testid="upload-progress">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={uploadMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={uploadMutation.isPending}
                data-testid="button-upload"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Notes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
