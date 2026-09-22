import type { Board, ClassroomCourse, Settings } from '../types';
import { generateBoardPDF } from '../utils/pdfExport';
import {
  getStoredAccessToken,
  uploadPdfToGoogleDrive,
  createClassroomPost,
} from './googleClassroom';
import { formatPeriodNumbers } from '../utils/periodSchedule';

export interface UploadPeriodNotesResult {
  success: boolean;
  skippedEmpty?: boolean;
  driveFileId?: string;
  postLink?: string;
  filename?: string;
  error?: string;
}

export async function uploadPeriodNotesToClassroom(params: {
  board: Board;
  settings: Settings;
  course: ClassroomCourse;
  periodNumbers: number[];
  onProgress?: (status: 'generating' | 'uploading' | 'posting', message: string) => void;
}): Promise<UploadPeriodNotesResult> {
  const { board, settings, course, periodNumbers, onProgress } = params;

  // 1. Check if the whiteboard has any strokes, shapes, text, or images
  const totalObjects = board.pages.reduce((count, page) => count + (page.objects?.length || 0), 0);
  if (totalObjects === 0) {
    return {
      success: true,
      skippedEmpty: true,
      filename: 'Empty board',
    };
  }

  const periodLabel = formatPeriodNumbers(periodNumbers);
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const postTitle = `${course.name} - ${periodLabel} Notes (${dateStr})`;
  const description = `Attached are the official whiteboard slides and lecture notes automatically recorded during ${periodLabel}.`;

  try {
    // 2. Generate PDF from all slides
    if (onProgress) {
      onProgress('generating', `Preparing ${board.pages.length} whiteboard slide${board.pages.length > 1 ? 's' : ''} as PDF...`);
    }

    const { blob, filename } = await generateBoardPDF(
      board,
      settings,
      (curr, total) => {
        if (onProgress) {
          onProgress('generating', `Rendering slide ${curr} of ${total}...`);
        }
      },
      postTitle
    );

    // 3. Verify OAuth token
    const token = getStoredAccessToken();
    if (!token) {
      return {
        success: false,
        error: 'Google Classroom is not connected. Sign in with Google to enable automated uploading.',
        filename,
      };
    }

    // 4. Upload PDF to Google Drive
    if (onProgress) {
      onProgress('uploading', `Uploading "${filename}" to Google Drive...`);
    }

    const driveRes = await uploadPdfToGoogleDrive(token, blob, filename);
    const driveFileId = driveRes.id;

    // 5. Create Announcement in Google Classroom
    if (onProgress) {
      onProgress('posting', `Publishing announcement to "${course.name}"...`);
    }

    const classroomRes = await createClassroomPost(token, course.id, {
      title: postTitle,
      text: description,
      driveFileId,
      driveFileTitle: filename,
      postType: 'announcement',
    });

    const postLink = classroomRes.alternateLink || `https://classroom.google.com/c/${course.id}`;

    return {
      success: true,
      driveFileId,
      postLink,
      filename,
    };
  } catch (err: any) {
    console.error('Failed to auto-upload period notes to Classroom:', err);
    return {
      success: false,
      error: err?.message || 'Failed to upload notes to Google Classroom.',
    };
  }
}
