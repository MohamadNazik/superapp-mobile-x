// internal/file/validator.go
package file

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"pay-slip-app/internal/constants"
)

// mimeMapping provides a single source of truth for allowed extensions and their canonical MIME types
var mimeMapping = map[string]string{
	".pdf":  "application/pdf",
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
}

// GetAllowedExtensions returns a copy of the allowed file extensions for pay slips.
func GetAllowedExtensions() []string {
	// Return a copy to ensure immutability
	extensions := make([]string, len(constants.AllowedExtensions))
	copy(extensions, constants.AllowedExtensions)
	return extensions
}

// GetAllowedExtensionsMap returns a map of allowed file extensions for efficient lookup.
func GetAllowedExtensionsMap() map[string]struct{} {
	m := make(map[string]struct{}, len(constants.AllowedExtensions))
	for _, ext := range constants.AllowedExtensions {
		m[ext] = struct{}{}
	}
	return m
}

// ValidatePaySlipFile validates the filename extension and the actual content (magic bytes).
// It reads the first 512 bytes of the file and resets the file pointer using Seek.
// Returns the detected MIME type and nil on success, or an error if invalid.
func ValidatePaySlipFile(filename string, r io.ReadSeeker) (string, error) {
	ext := strings.ToLower(filepath.Ext(filename))

	// 1. Validate Extension against our known allowed list
	canonicalMime, supported := mimeMapping[ext]
	if !supported {
		return "", fmt.Errorf("unsupported or invalid file extension: %s", ext)
	}

	// 2. Validate actual content for security
	// http.DetectContentType uses the first 512 bytes to determine the MIME type.
	buffer := make([]byte, 512)
	n, err := r.Read(buffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("failed to read file for validation: %w", err)
	}

	// 3. Reset file pointer so subsequent reads (e.g., storage upload) start from the beginning.
	if _, err := r.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("failed to reset file pointer: %w", err)
	}

	detectedMime := http.DetectContentType(buffer[:n])

	// Clean detected MIME (remove charset info if present)
	if parts := strings.Split(detectedMime, ";"); len(parts) > 0 {
		detectedMime = parts[0]
	}

	// 4. Make sure the extension matches the actual content type
	if detectedMime != canonicalMime {
		return "", fmt.Errorf("file content (%s) does not match extension (%s)", detectedMime, ext)
	}

	return detectedMime, nil
}
