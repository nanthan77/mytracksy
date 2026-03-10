import { useState } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuth } from './useAuth';

export const useFirebaseStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const uploadFile = async (file: File, folder: string = 'general'): Promise<UploadTask> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `users/${user.uid}/${folder}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking handled by caller
        },
        (error) => {
          setError(`Upload failed: ${error.message}`);
          setUploading(false);
        },
        () => {
          setUploading(false);
        }
      );

      return uploadTask;
    } catch (error: any) {
      setError(`Upload failed: ${error.message}`);
      setUploading(false);
      throw error;
    }
  };

  const downloadFile = async (filePath: string): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const storageRef = ref(storage, filePath);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      setError(`Download failed: ${error.message}`);
      throw error;
    }
  };

  const deleteFile = async (filePath: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error: any) {
      setError(`Delete failed: ${error.message}`);
      throw error;
    }
  };

  const getFileList = async (folder: string = 'general'): Promise<any[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const folderRef = ref(storage, `users/${user.uid}/${folder}`);
      const result = await listAll(folderRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          downloadURL
        };
      });

      return await Promise.all(filePromises);
    } catch (error: any) {
      setError(`Failed to list files: ${error.message}`);
      throw error;
    }
  };

  const exportData = async (data: any, filename: string): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });
      
      const uploadTask = await uploadFile(file, 'exports');
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          null,
          reject,
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error: any) {
      setError(`Export failed: ${error.message}`);
      throw error;
    }
  };

  const generateBackup = async (expenses: any[], userProfile: any): Promise<string> => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      user: {
        id: user?.uid,
        email: user?.email,
        profile: userProfile
      },
      expenses,
      metadata: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        categories: [...new Set(expenses.map(e => e.category))],
        dateRange: {
          from: expenses.length > 0 ? Math.min(...expenses.map(e => new Date(e.date).getTime())) : null,
          to: expenses.length > 0 ? Math.max(...expenses.map(e => new Date(e.date).getTime())) : null
        }
      }
    };

    const filename = `mytracksy-backup-${new Date().toISOString().split('T')[0]}.json`;
    return await exportData(backupData, filename);
  };

  return {
    uploading,
    error,
    uploadFile,
    downloadFile,
    deleteFile,
    getFileList,
    exportData,
    generateBackup
  };
};