/**
 * Firebase Firestore Security Rules and Indexes Setup
 * Complete security configuration for MyTracksy production
 */

const fs = require('fs');
const path = require('path');

class FirestoreSetup {
    constructor() {
        console.log('🔥 Setting up Firestore security rules and indexes...');
    }

    createSecurityRules() {
        const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions for authentication and authorization
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isCompanyOwner(companyId) {
      return request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId)).data.owners;
    }
    
    function isCompanyMember(companyId) {
      return request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId)).data.employees ||
             request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId)).data.owners;
    }
    
    function isValidExpense(expense) {
      return expense.keys().hasAll(['amount', 'category', 'description', 'date', 'userId']) &&
             expense.amount is number &&
             expense.amount > 0 &&
             expense.category is string &&
             expense.description is string &&
             expense.date is timestamp &&
             expense.userId == request.auth.uid;
    }
    
    function isValidUser(user) {
      return user.keys().hasAll(['email', 'profile', 'createdAt']) &&
             user.email is string &&
             user.profile is map &&
             user.createdAt is timestamp;
    }
    
    // Users collection rules
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId) && isValidUser(resource.data);
    }
    
    // Companies collection rules
    match /companies/{companyId} {
      allow read: if isAuthenticated() && isCompanyMember(companyId);
      allow write: if isAuthenticated() && isCompanyOwner(companyId);
      allow create: if isAuthenticated() && request.auth.uid in resource.data.owners;
    }
    
    // Expenses collection rules
    match /expenses/{expenseId} {
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.userId) || 
                      isCompanyMember(resource.data.companyId));
      allow create: if isAuthenticated() && 
                       isOwner(resource.data.userId) && 
                       isValidExpense(resource.data);
      allow update: if isAuthenticated() && 
                       isOwner(resource.data.userId) &&
                       resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Tax calculations collection rules
    match /taxCalculations/{calcId} {
      allow read, write: if isAuthenticated() && 
                           (isOwner(resource.data.userId) ||
                            isCompanyMember(resource.data.companyId));
      allow create: if isAuthenticated() && request.auth.uid == resource.data.userId;
    }
    
    // Government filings collection rules
    match /governmentFilings/{filingId} {
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.userId) ||
                      isCompanyMember(resource.data.companyId));
      allow create, update: if isAuthenticated() && 
                              isOwner(resource.data.userId) &&
                              request.auth.uid == resource.data.userId;
      allow delete: if false; // Government filings should not be deleted
    }
    
    // Employees collection rules
    match /employees/{employeeId} {
      allow read: if isAuthenticated() && 
                     (isCompanyOwner(resource.data.companyId) ||
                      request.auth.uid == resource.data.userId);
      allow write: if isAuthenticated() && isCompanyOwner(resource.data.companyId);
    }
    
    // Reports collection rules
    match /reports/{reportId} {
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.userId) ||
                      isCompanyMember(resource.data.companyId));
      allow create: if isAuthenticated() && request.auth.uid == resource.data.userId;
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Analytics collection rules (read-only for users)
    match /analytics/{analyticsId} {
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.userId) ||
                      isCompanyMember(resource.data.companyId));
      allow write: if false; // Only system can write analytics
    }
    
    // System configurations (read-only for users)
    match /systemConfigurations/{configId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin functions can modify
    }
    
    // Tax configurations (read-only for users)
    match /taxConfigurations/{taxConfigId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin functions can modify
    }
    
    // Schemas (read-only for users)
    match /schemas/{schemaId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin functions can modify
    }
    
    // Audit logs (read-only for users, write-only for system)
    match /auditLogs/{logId} {
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.userId) ||
                      isCompanyMember(resource.data.companyId));
      allow write: if false; // Only system can write audit logs
    }
    
    // User activity logs
    match /users/{userId}/activityLogs/{logId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if false; // Only system can write activity logs
    }
    
    // Company-specific subcollections
    match /companies/{companyId}/expenses/{expenseId} {
      allow read, write: if isAuthenticated() && isCompanyMember(companyId);
    }
    
    match /companies/{companyId}/employees/{employeeId} {
      allow read: if isAuthenticated() && isCompanyMember(companyId);
      allow write: if isAuthenticated() && isCompanyOwner(companyId);
    }
    
    match /companies/{companyId}/reports/{reportId} {
      allow read, write: if isAuthenticated() && isCompanyMember(companyId);
    }
    
    // Backup collections (admin only)
    match /backups/{backupId} {
      allow read, write: if false; // Only admin functions
    }
    
    // Default deny rule for any unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

        return rules;
    }

    createIndexes() {
        const indexes = {
            "indexes": [
                {
                    "collectionGroup": "expenses",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "userId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "date",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "expenses",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "companyId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "date",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "expenses",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "userId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "category",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "date",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "expenses",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "userId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "approvalStatus",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "date",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "taxCalculations",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "userId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "taxType",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "calculatedAt",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "governmentFilings",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "userId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "status",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "dueDate",
                            "order": "ASCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "governmentFilings",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "companyId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "filingType",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "submittedAt",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "companies",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "owners",
                            "arrayConfig": "CONTAINS"
                        },
                        {
                            "fieldPath": "isActive",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "createdAt",
                            "order": "DESCENDING"
                        }
                    ]
                },
                {
                    "collectionGroup": "auditLogs",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {
                            "fieldPath": "userId",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "action",
                            "order": "ASCENDING"
                        },
                        {
                            "fieldPath": "timestamp",
                            "order": "DESCENDING"
                        }
                    ]
                }
            ],
            "fieldOverrides": [
                {
                    "collectionGroup": "expenses",
                    "fieldPath": "tags",
                    "indexes": [
                        {
                            "order": "ASCENDING",
                            "queryScope": "COLLECTION"
                        },
                        {
                            "arrayConfig": "CONTAINS",
                            "queryScope": "COLLECTION"
                        }
                    ]
                },
                {
                    "collectionGroup": "users",
                    "fieldPath": "taxProfile.tinNumber",
                    "indexes": [
                        {
                            "order": "ASCENDING",
                            "queryScope": "COLLECTION"
                        }
                    ]
                },
                {
                    "collectionGroup": "companies",
                    "fieldPath": "vatNumber",
                    "indexes": [
                        {
                            "order": "ASCENDING",
                            "queryScope": "COLLECTION"
                        }
                    ]
                }
            ]
        };

        return indexes;
    }

    createStorageRules() {
        const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload and read their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Company files - accessible by company members
    match /companies/{companyId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
                            request.auth.uid in resource.metadata.companyMembers;
    }
    
    // Receipt images
    match /receipts/{userId}/{receiptId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Generated reports
    match /reports/{userId}/{reportId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can write reports
    }
    
    // Profile pictures
    match /profile-pictures/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Backup files (admin only)
    match /backups/{allPaths=**} {
      allow read, write: if false; // Only admin functions
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}`;

        return storageRules;
    }

    async setupFirestoreRules() {
        console.log('🔒 Creating Firestore security rules...');
        
        // Create firestore directory
        const firestoreDir = './firestore';
        if (!fs.existsSync(firestoreDir)) {
            fs.mkdirSync(firestoreDir, { recursive: true });
        }

        // Write security rules
        const rulesPath = path.join(firestoreDir, 'firestore.rules');
        fs.writeFileSync(rulesPath, this.createSecurityRules());
        console.log('✅ Security rules created at:', rulesPath);

        // Write indexes
        const indexesPath = path.join(firestoreDir, 'firestore.indexes.json');
        fs.writeFileSync(indexesPath, JSON.stringify(this.createIndexes(), null, 2));
        console.log('✅ Indexes created at:', indexesPath);

        // Write storage rules
        const storageRulesPath = './storage.rules';
        fs.writeFileSync(storageRulesPath, this.createStorageRules());
        console.log('✅ Storage rules created at:', storageRulesPath);

        console.log('🎉 Firestore security setup completed!');
        
        return {
            rules: rulesPath,
            indexes: indexesPath,
            storage: storageRulesPath
        };
    }
}

// Additional utility functions for Firebase deployment
class FirebaseDeploymentHelper {
    static createFirebaseConfig(projectId) {
        return {
            hosting: {
                public: "hosting",
                ignore: [
                    "firebase.json",
                    "**/.*",
                    "**/node_modules/**"
                ],
                rewrites: [
                    {
                        source: "/api/**",
                        function: "api"
                    },
                    {
                        source: "**",
                        destination: "/index.html"
                    }
                ],
                headers: [
                    {
                        source: "**/*.@(js|css)",
                        headers: [
                            {
                                key: "Cache-Control",
                                value: "max-age=31536000"
                            }
                        ]
                    },
                    {
                        source: "sw.js",
                        headers: [
                            {
                                key: "Cache-Control",
                                value: "no-cache"
                            }
                        ]
                    }
                ]
            },
            functions: {
                source: "functions",
                runtime: "nodejs18",
                predeploy: [
                    "npm --prefix \"$RESOURCE_DIR\" run build"
                ]
            },
            firestore: {
                rules: "firestore/firestore.rules",
                indexes: "firestore/firestore.indexes.json"
            },
            storage: {
                rules: "storage.rules"
            },
            emulators: {
                auth: { port: 9099 },
                functions: { port: 5001 },
                firestore: { port: 8080 },
                hosting: { port: 5000 },
                storage: { port: 9199 },
                ui: { enabled: true, port: 4000 },
                singleProjectMode: true
            }
        };
    }

    static createPackageJson() {
        return {
            name: "mytracksy",
            version: "1.0.0",
            description: "Sri Lankan Financial Intelligence Platform",
            scripts: {
                dev: "firebase emulators:start",
                build: "cd functions && npm run build",
                deploy: "firebase deploy",
                "deploy:hosting": "firebase deploy --only hosting",
                "deploy:functions": "firebase deploy --only functions",
                "deploy:firestore": "firebase deploy --only firestore",
                "deploy:storage": "firebase deploy --only storage",
                test: "cd functions && npm test",
                logs: "firebase functions:log"
            },
            keywords: ["sri-lanka", "tax-compliance", "firebase", "pwa"],
            author: "MyTracksy Team",
            license: "MIT",
            engines: {
                node: "18"
            }
        };
    }

    static createPWAManifest() {
        return {
            name: "MyTracksy - Sri Lankan Financial Intelligence",
            short_name: "MyTracksy",
            description: "Complete Sri Lankan tax compliance and financial management platform",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#2563eb",
            orientation: "portrait-primary",
            icons: [
                {
                    src: "https://via.placeholder.com/192x192/2563eb/ffffff?text=MT",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "https://via.placeholder.com/512x512/2563eb/ffffff?text=MT",
                    sizes: "512x512",
                    type: "image/png"
                }
            ],
            categories: ["finance", "business", "productivity"],
            lang: "en",
            scope: "/"
        };
    }
}

// Export both classes
module.exports = { FirestoreSetup, FirebaseDeploymentHelper };

// CLI usage
if (require.main === module) {
    console.log('🔥 MyTracksy Firestore Security Setup');
    
    const setup = new FirestoreSetup();
    setup.setupFirestoreRules()
        .then(result => {
            console.log('\n📊 Setup Summary:');
            console.log('=================');
            console.log('✅ Firestore security rules configured');
            console.log('✅ Database indexes optimized for queries');
            console.log('✅ Storage security rules implemented');
            console.log('✅ Complete Sri Lankan tax compliance security');
            console.log('\n🚀 Files created:');
            console.log(`- ${result.rules}`);
            console.log(`- ${result.indexes}`);
            console.log(`- ${result.storage}`);
            console.log('\n📝 Next steps:');
            console.log('1. Deploy rules: firebase deploy --only firestore:rules');
            console.log('2. Deploy indexes: firebase deploy --only firestore:indexes');
            console.log('3. Deploy storage rules: firebase deploy --only storage');
            console.log('\nYour Firestore security is production-ready! 🎉');
        })
        .catch(error => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}