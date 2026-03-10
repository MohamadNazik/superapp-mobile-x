// internal/utils/mime_utils.go
package utils

import (
	"mime"
	"path/filepath"
	"pay-slip-app/internal/constants"
	"strings"
)

// GetValidatedMimeType checks if the extension is allowed and returns the MIME type.
func GetValidatedMimeType(filename string) (string, bool) {
	ext := strings.ToLower(filepath.Ext(filename))
	allowedMap := constants.GetAllowedExtensionsMap()
	
	if _, allowed := allowedMap[ext]; !allowed {
		return "", false
	}

	// mime.TypeByExtension returns the standard MIME type (e.g., "application/pdf")
	t := mime.TypeByExtension(ext)
	if t == "" {
		// Fallback for cases where the OS might not have the mime type registered
		switch ext {
		case ".pdf":
			return "application/pdf", true
		case ".png":
			return "image/png", true
		case ".jpg", ".jpeg":
			return "image/jpeg", true
		}
	}
	
	// mime.TypeByExtension can return "image/jpeg; charset=utf-8" in some envs
	// We want the clean MIME type
	if parts := strings.Split(t, ";"); len(parts) > 0 {
		t = parts[0]
	}

	return t, true
}
