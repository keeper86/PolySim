"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Camera, AlertCircle } from "lucide-react";

export const title = "Account Avatar Upload";

export default function AccountAvatarUpload01() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return "Please upload a valid image file (JPEG, PNG, GIF, or WebP)";
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (previewUrl) {
      setAvatarUrl(previewUrl);
      setPreviewUrl(null);
      console.log("Uploading avatar...");
    }
  };

  const handleRemove = () => {
    setAvatarUrl(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="bg-card border p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Profile Picture</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Upload a profile picture to personalize your account
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl || avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">ER</AvatarFallback>
            </Avatar>

            {!previewUrl && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 w-full text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Drop your image here, or{" "}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Supports JPEG, PNG, GIF, WebP (max 5MB)
                    </p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {previewUrl && (
              <div className="flex gap-3 w-full sm:w-auto">
                <Button onClick={handleUpload} className="flex-1 sm:flex-none">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1 sm:flex-none">
                  Cancel
                </Button>
              </div>
            )}

            {!previewUrl && avatarUrl && (
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                <Button
                  onClick={handleRemove}
                  variant="outline"
                  className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}

            {!previewUrl && !avatarUrl && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
