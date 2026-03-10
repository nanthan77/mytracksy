// Mock authentication service for demo purposes
// This allows the app to work without Firebase until properly configured

interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

class MockAuthService {
  private currentUser: MockUser | null = null;
  private users: Map<string, { password: string; user: MockUser }> = new Map();

  constructor() {
    // Add a default test user
    this.users.set('test@example.com', {
      password: 'password123',
      user: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    });

    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    } else {
      // Auto-login with test user for demo
      this.currentUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      };
      localStorage.setItem('mockUser', JSON.stringify(this.currentUser));
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userData = this.users.get(email);
        if (!userData) {
          reject({ code: 'auth/user-not-found', message: 'No user found with this email' });
          return;
        }

        if (userData.password !== password) {
          reject({ code: 'auth/wrong-password', message: 'Incorrect password' });
          return;
        }

        this.currentUser = userData.user;
        localStorage.setItem('mockUser', JSON.stringify(this.currentUser));
        resolve({ user: userData.user });
      }, 500); // Simulate network delay
    });
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.users.has(email)) {
          reject({ code: 'auth/email-already-in-use', message: 'Email already in use' });
          return;
        }

        const newUser: MockUser = {
          uid: `user-${Date.now()}`,
          email,
          displayName: email.split('@')[0] // Default display name
        };

        this.users.set(email, { password, user: newUser });
        this.currentUser = newUser;
        localStorage.setItem('mockUser', JSON.stringify(this.currentUser));
        resolve({ user: newUser });
      }, 500);
    });
  }

  async updateProfile(user: MockUser, profile: { displayName?: string; photoURL?: string }): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentUser && this.currentUser.uid === user.uid) {
          this.currentUser.displayName = profile.displayName || this.currentUser.displayName;
          this.currentUser.photoURL = profile.photoURL || this.currentUser.photoURL;
          localStorage.setItem('mockUser', JSON.stringify(this.currentUser));
        }
        resolve();
      }, 200);
    });
  }

  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('mockUser');
        resolve();
      }, 200);
    });
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void): () => void {
    // Immediately call with current user
    setTimeout(() => callback(this.currentUser), 0);
    
    // Return unsubscribe function
    return () => {};
  }

  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }
}

export const mockAuth = new MockAuthService();
export type { MockUser };