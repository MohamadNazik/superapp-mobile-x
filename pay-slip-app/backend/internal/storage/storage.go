// internal/storage/storage.go
package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
)

// FirebaseStorage wraps a GCS client scoped to a single bucket.
type FirebaseStorage struct {
	client *storage.Client
	bucket string
}

// New creates a FirebaseStorage backed by the given GCS client and bucket name.
func New(client *storage.Client, bucket string) *FirebaseStorage {
	return &FirebaseStorage{client: client, bucket: bucket}
}

// UploadFile uploads a file to Firebase Storage and returns the public download URL.
// In a real Firebase setup, this might require generating a download token or using
// the public URL format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media
func (s *FirebaseStorage) UploadFile(ctx context.Context, r io.Reader, originalFilename string) (string, error) {
	ext := filepath.Ext(originalFilename)
	objectPath := "pay-slips/" + uuid.New().String() + ext

	wc := s.client.Bucket(s.bucket).Object(objectPath).NewWriter(ctx)
	// Set Content-Type based on extension for better browser handling
	wc.ContentType = s.getContentType(ext)
	
	if _, err := io.Copy(wc, r); err != nil {
		_ = wc.Close()
		return "", fmt.Errorf("storage: copy to GCS failed: %w", err)
	}
	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("storage: close GCS writer failed: %w", err)
	}

	// For Firebase Storage, the public-ish URL format is:
	// https://firebasestorage.googleapis.com/v0/b/<bucket>/o/pay-slips%2F<filename>?alt=media
	// Note: Without a 'token', this may require the bucket to have public read access
	// or the frontend to use its own auth to access it.
	// For this implementation, we return the path-based URL.
	url := fmt.Sprintf("https://firebasestorage.googleapis.com/v0/b/%s/o/pay-slips%%2F%s?alt=media", 
		s.bucket, filepath.Base(objectPath))

	return url, nil
}

func (s *FirebaseStorage) getContentType(ext string) string {
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	default:
		return "application/octet-stream"
	}
}
