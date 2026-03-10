// Mock Firestore service for demo purposes
// This allows the app to work without Firebase until properly configured

interface MockDoc {
  id: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

class MockFirestore {
  private collections: Map<string, Map<string, MockDoc>> = new Map();
  private docCounter = 0;

  constructor() {
    // Initialize collections
    this.collections.set('users', new Map());
    this.collections.set('expenses', new Map());
    this.collections.set('budgets', new Map());
    this.collections.set('categories', new Map());
    this.collections.set('income', new Map());
    this.collections.set('notifications', new Map());
    this.collections.set('notificationSettings', new Map());

    // Load data from localStorage
    this.loadFromStorage();
  }

  private saveToStorage() {
    const data: any = {};
    this.collections.forEach((collection, collectionName) => {
      data[collectionName] = {};
      collection.forEach((doc, docId) => {
        data[collectionName][docId] = {
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString()
        };
      });
    });
    localStorage.setItem('mockFirestore', JSON.stringify(data));
  }

  private loadFromStorage() {
    const data = localStorage.getItem('mockFirestore');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        Object.entries(parsedData).forEach(([collectionName, docs]: [string, any]) => {
          const collection = new Map();
          Object.entries(docs).forEach(([docId, doc]: [string, any]) => {
            collection.set(docId, {
              ...doc,
              createdAt: new Date(doc.createdAt),
              updatedAt: new Date(doc.updatedAt)
            });
          });
          this.collections.set(collectionName, collection);
        });
      } catch (error) {
        console.warn('Failed to load mock data from localStorage:', error);
      }
    }
  }

  private generateId(): string {
    return `doc-${++this.docCounter}-${Date.now()}`;
  }

  // Add document
  async addDoc(collectionName: string, data: any): Promise<{ id: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = this.collections.get(collectionName) || new Map();
        const id = this.generateId();
        const doc: MockDoc = {
          id,
          data: { ...data },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        collection.set(id, doc);
        this.collections.set(collectionName, collection);
        this.saveToStorage();
        resolve({ id });
      }, 100);
    });
  }

  // Set document
  async setDoc(collectionName: string, docId: string, data: any, options?: { merge?: boolean }): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = this.collections.get(collectionName) || new Map();
        const existingDoc = collection.get(docId);
        
        const doc: MockDoc = {
          id: docId,
          data: options?.merge && existingDoc ? { ...existingDoc.data, ...data } : { ...data },
          createdAt: existingDoc?.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        collection.set(docId, doc);
        this.collections.set(collectionName, collection);
        this.saveToStorage();
        resolve();
      }, 100);
    });
  }

  // Get document
  async getDoc(collectionName: string, docId: string): Promise<{ exists: () => boolean; data: () => any; id: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = this.collections.get(collectionName);
        const doc = collection?.get(docId);
        resolve({
          exists: () => !!doc,
          data: () => doc?.data,
          id: docId
        });
      }, 50);
    });
  }

  // Get documents with query
  async getDocs(collectionName: string, where?: { field: string; operator: string; value: any }[]): Promise<{
    docs: Array<{ id: string; data: () => any }>;
    empty: boolean;
    size: number;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = this.collections.get(collectionName) || new Map();
        let docs = Array.from(collection.values());

        // Apply where filters
        if (where) {
          docs = docs.filter(doc => {
            return where.every(condition => {
              const fieldValue = this.getNestedValue(doc.data, condition.field);
              switch (condition.operator) {
                case '==':
                  return fieldValue === condition.value;
                case '>=':
                  return fieldValue >= condition.value;
                case '<=':
                  return fieldValue <= condition.value;
                case '>':
                  return fieldValue > condition.value;
                case '<':
                  return fieldValue < condition.value;
                default:
                  return true;
              }
            });
          });
        }

        const result = docs.map(doc => ({
          id: doc.id,
          data: () => doc.data
        }));

        resolve({
          docs: result,
          empty: result.length === 0,
          size: result.length
        });
      }, 100);
    });
  }

  // Update document
  async updateDoc(collectionName: string, docId: string, data: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = this.collections.get(collectionName);
        const existingDoc = collection?.get(docId);
        if (existingDoc) {
          existingDoc.data = { ...existingDoc.data, ...data };
          existingDoc.updatedAt = new Date();
          this.saveToStorage();
        }
        resolve();
      }, 100);
    });
  }

  // Delete document
  async deleteDoc(collectionName: string, docId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = this.collections.get(collectionName);
        collection?.delete(docId);
        this.saveToStorage();
        resolve();
      }, 100);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Clear all data (for testing)
  clearAll(): void {
    this.collections.clear();
    localStorage.removeItem('mockFirestore');
    this.constructor();
  }
}

export const mockFirestore = new MockFirestore();