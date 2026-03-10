import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider
} from '@mui/material';
import {
  Category as CategoryIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon
} from '@mui/icons-material';
import CategoryManager from '../../components/common/CategoryManager';
import NotificationSettings from '../../components/notifications/NotificationSettings';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('categories');

  const settingsSections = [
    {
      id: 'categories',
      title: 'Categories',
      description: 'Manage expense categories',
      icon: <CategoryIcon />
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Update your profile information',
      icon: <PersonIcon />
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Change password and security settings',
      icon: <SecurityIcon />
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure notification preferences',
      icon: <NotificationsIcon />
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Theme and display settings',
      icon: <ThemeIcon />
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'categories':
        return <CategoryManager />;
      case 'profile':
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Profile Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Profile management coming soon...
            </Typography>
          </Box>
        );
      case 'security':
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Security settings coming soon...
            </Typography>
          </Box>
        );
      case 'notifications':
        return <NotificationSettings />;
      case 'appearance':
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theme and appearance settings coming soon...
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your account settings, preferences, and app configuration.
        </Typography>

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Settings Navigation */}
          <Paper sx={{ width: 280, height: 'fit-content' }}>
            <List>
              {settingsSections.map((section, index) => (
                <React.Fragment key={section.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={activeSection === section.id}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <ListItemIcon>{section.icon}</ListItemIcon>
                      <ListItemText
                        primary={section.title}
                        secondary={section.description}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < settingsSections.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          {/* Settings Content */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3 }}>
              {renderContent()}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;