// internal/storage/storage.go
package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"pay-slip-app/internal/configs"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
	"google.golang.org/api/option"
)

var (
	// ErrObjectNotExist is the error returned when an object is not found in GCS.
	ErrObjectNotExist = storage.ErrObjectNotExist
)

// FirebaseStorage wraps a GCS client scoped to a single bucket.
type FirebaseStorage struct {
	client *storage.Client
	bucket string
}

// GetSignedURL generates a V4 Signed URL for the given object path.
func (s *FirebaseStorage) GetSignedURL(objectPath string) (string, error) {
	opts := &storage.SignedURLOptions{
		Scheme:         storage.SigningSchemeV4,
		Method:         "GET",
		Expires:        time.Now().Add(1 * time.Hour), // 1 hour expiration
	}

	url, err := s.client.Bucket(s.bucket).SignedURL(objectPath, opts)
	if err != nil {
		return "", fmt.Errorf("storage: failed to generate signed URL: %w", err)
	}

	return url, nil
}

// NewFirebaseStorage creates a FirebaseStorage by initializing a GCS client from the provided config.
func NewFirebaseStorage(ctx context.Context, cfg configs.FirebaseConfig) (*FirebaseStorage, error) {
	var opts []option.ClientOption
	if cfg.Credentials != "" {
		opts = append(opts, option.WithCredentialsFile(cfg.Credentials))
	}

	client, err := storage.NewClient(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("storage: failed to create GCS client: %w", err)
	}

	return &FirebaseStorage{
		client: client,
		bucket: cfg.StorageBucket,
	}, nil
}

// Close closes the underlying GCS client.
func (s *FirebaseStorage) Close() error {
	if s.client != nil {
		return s.client.Close()
	}
	return nil
}

// UploadFile uploads a file to Firebase Storage and returns the clean storage path.
func (s *FirebaseStorage) UploadFile(ctx context.Context, r io.Reader, originalFilename string, contentType string) (string, error) {
	ext := filepath.Ext(originalFilename)
	objectPath := "pay-slips/" + uuid.New().String() + ext

	wc := s.client.Bucket(s.bucket).Object(objectPath).NewWriter(ctx)
	// Set Content-Type for better browser handling
	wc.ContentType = contentType
	
	if _, err := io.Copy(wc, r); err != nil {
		_ = wc.Close()
		return "", fmt.Errorf("storage: copy to GCS failed: %w", err)
	}
	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("storage: close GCS writer failed: %w", err)
	}

	return objectPath, nil
}

// DeleteFile deletes an object from the bucket.
func (s *FirebaseStorage) DeleteFile(ctx context.Context, objectPath string) error {
	if objectPath == "" {
		return nil
	}
	err := s.client.Bucket(s.bucket).Object(objectPath).Delete(ctx)
	if err != nil {
		return fmt.Errorf("storage: failed to delete object %q: %w", objectPath, err)
	}
	return nil
}