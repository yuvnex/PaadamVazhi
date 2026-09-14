import type { ClassroomCourse } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.announcements',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const STORAGE_KEY_TOKEN = 'gclass_access_token';
const STORAGE_KEY_CLIENT_ID = 'gclass_client_id';

// Permanently embedded Google OAuth 2.0 Client ID for this app.
// Only the Client ID is needed for the browser-side implicit grant flow.
const APP_CLIENT_ID = '75827423155-smb0mducttbsrerd07kul1kev1eqr273.apps.googleusercontent.com';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setStoredAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}

export function getStoredClientId(): string {
  // Always fall back to the embedded app Client ID
  return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || APP_CLIENT_ID;
}

export function setStoredClientId(clientId: string) {
  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
}

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    Capacitor.isNativePlatform() ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024)
  );
}

export function getGoogleOAuthUrl(clientId?: string): string {
  const activeClientId = clientId || getStoredClientId();
  const origin = window.location.origin;
  const pathname = window.location.pathname === '/' ? '' : window.location.pathname.replace(/\/$/, '');
  const redirectUri = origin + pathname;

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    activeClientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=${encodeURIComponent(
    CLASSROOM_SCOPES
  )}&include_granted_scopes=true&prompt=select_account%20consent`;
}

export async function redirectToGoogleOAuth(clientId?: string) {
  const activeClientId = clientId || getStoredClientId();
  setStoredClientId(activeClientId);
  const url = getGoogleOAuthUrl(activeClientId);

  if (Capacitor.isNativePlatform()) {
    // Opens Chrome Custom Tabs inside the app for seamless login & auto-return
    try {
      await Browser.open({ url });
    } catch {
      window.location.href = url;
    }
  } else {
    window.location.href = url;
  }
}

/**
 * Triggers Google OAuth 2.0 Sign-in.
 * On mobile/Android/iOS/Capacitor, it uses direct top-level redirect to prevent the GIS popup blank screen bug.
 * On desktop, it attempts GIS token client popup with direct popup fallback.
 */
export async function authenticateWithGoogle(clientId?: string): Promise<string> {
  const activeClientId = clientId || getStoredClientId();
  if (!activeClientId) {
    throw new Error('CLIENT_ID_REQUIRED');
  }

  setStoredClientId(activeClientId);

  // On mobile browsers and native apps, GIS popups open as detached tabs that freeze on a blank accounts.google.com screen.
  // Direct redirect is the standard and reliable OAuth flow on mobile.
  if (isMobileDevice()) {
    await redirectToGoogleOAuth(activeClientId);
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Redirecting to Google Sign-In... Please complete sign-in in your browser.'));
      }, 5000);
    });
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    // Direct OAuth popup fallback
    const launchDirectPopup = () => {
      const redirectUri = window.location.origin;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        activeClientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${encodeURIComponent(
        CLASSROOM_SCOPES
      )}&include_granted_scopes=true&prompt=select_account%20consent`;

      const popup = window.open(oauthUrl, 'google_oauth_popup', 'width=550,height=650,menubar=no,toolbar=no');
      if (!popup) {
        reject(new Error('Popup was blocked by the browser. Use the Direct Redirect Sign-In option.'));
        return;
      }

      const interval = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(interval);
            if (!resolved) {
              reject(new Error('Sign-in window was closed. If you got stuck on a blank screen, please use the Direct Redirect button.'));
            }
            return;
          }
          if (popup.location.href.includes('access_token')) {
            const hash = popup.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            if (token) {
              resolved = true;
              setStoredAccessToken(token);
              popup.close();
              clearInterval(interval);
              resolve(token);
            }
          }
        } catch {
          // Cross-origin access until redirect matches origin
        }
      }, 500);
    };

    if (!window.google?.accounts?.oauth2) {
      launchDirectPopup();
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: CLASSROOM_SCOPES,
        error_callback: (error) => {
          if (!resolved) {
            resolved = true;
            reject(new Error(error?.message || 'Google Sign-In failed. Try using Direct Redirect.'));
          }
        },
        callback: (response) => {
          if (response.error) {
            if (!resolved) {
              resolved = true;
              reject(new Error(response.error_description || response.error));
            }
            return;
          }
          if (response.access_token) {
            resolved = true;
            setStoredAccessToken(response.access_token);
            resolve(response.access_token);
          } else {
            if (!resolved) {
              resolved = true;
              reject(new Error('No access token received from Google authorization.'));
            }
          }
        },
      });

      // Forces Google to show list of all Gmail accounts and permissions consent screen
      client.requestAccessToken({ prompt: 'select_account consent' });

      // Safety timeout: if GIS hangs (e.g. gsi/transform tab opener severed), reject with helpful advice after 45s
      setTimeout(() => {
        if (!resolved) {
          reject(new Error('Sign-in timed out. If you saw a blank "gsi/transform" screen, please use the Direct Redirect Sign-In button.'));
        }
      }, 45000);
    } catch (err: any) {
      launchDirectPopup();
    }
  });
}

/**
 * Fetches real user profile (email, name, picture) using OAuth Access Token
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<{ email: string; name: string; avatar?: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setStoredAccessToken(null);
      throw new Error('Google authorization expired. Please sign in again.');
    }
    throw new Error(`Failed to fetch Google profile (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  return {
    email: data.email || '',
    name: data.name || data.given_name || data.email?.split('@')[0] || 'Google User',
    avatar: data.picture,
  };
}

/**
 * Fetches all real courses from Google Classroom REST API v1
 * Endpoint: GET https://classroom.googleapis.com/v1/courses
 */
export async function fetchGoogleClassroomCourses(accessToken: string): Promise<ClassroomCourse[]> {
  const colors = ['#1e8e3e', '#1a73e8', '#d93025', '#f29900', '#9334e6', '#00897b', '#3949ab', '#e91e63'];

  // Try fetching teacher courses first
  let rawCourses: any[] = [];
  try {
    const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      rawCourses = data.courses || [];
    } else if (res.status === 401) {
      setStoredAccessToken(null);
      throw new Error('Google session expired. Please sign in again.');
    } else {
      // Fallback to teacherId=me
      const teacherRes = await fetch('https://classroom.googleapis.com/v1/courses?teacherId=me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (teacherRes.ok) {
        const teacherData = await teacherRes.json();
        rawCourses = teacherData.courses || [];
      } else {
        const errJson = await teacherRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Google Classroom API error (${teacherRes.status})`);
      }
    }
  } catch (err: any) {
    console.error('Error fetching Google Classroom courses:', err);
    throw err;
  }

  return rawCourses.map((c, i) => ({
    id: c.id,
    name: c.name || 'Untitled Classroom',
    section: c.section || undefined,
    room: c.room || undefined,
    studentsCount: c.enrollmentCode ? undefined : undefined,
    color: colors[i % colors.length],
  }));
}

/**
 * Uploads a generated multi-slide PDF Blob to Google Drive using multipart upload
 * Endpoint: POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
 */
export async function uploadPdfToGoogleDrive(
  accessToken: string,
  pdfBlob: Blob,
  filename: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: filename,
    mimeType: 'application/pdf',
    description: 'Lecture whiteboard notes exported as unified multi-page PDF',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

  const base64Data = await base64Promise;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/pdf\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive Upload failed: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Submits the uploaded PDF as an Announcement or Coursework Material to Google Classroom
 * Endpoint: POST https://classroom.googleapis.com/v1/courses/{courseId}/announcements
 */
export async function createClassroomPost(
  accessToken: string,
  courseId: string,
  postData: {
    title: string;
    text: string;
    driveFileId: string;
    driveFileTitle: string;
    postType: 'announcement' | 'material' | 'assignment';
  }
): Promise<{ id: string; alternateLink?: string }> {
  const announcementBody = {
    text: `${postData.title}\n\n${postData.text}`,
    materials: [
      {
        driveFile: {
          driveFile: {
            id: postData.driveFileId,
            title: postData.driveFileTitle,
          },
          shareMode: 'VIEW',
        },
      },
    ],
    state: 'PUBLISHED',
  };

  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(announcementBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Classroom Post failed: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

