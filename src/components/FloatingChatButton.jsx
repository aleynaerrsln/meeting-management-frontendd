import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Box,
  Slide,
  useMediaQuery,
  useTheme,
  Chip
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchUnreadCount();
    fetchUnreadByUser();

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadByUser();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/messages/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Okunmamış mesaj hatası:', error);
    }
  };

  const fetchUnreadByUser = async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-by-user');
      const unreadMap = {};
      response.data.data.forEach(item => {
        unreadMap[item._id] = item.count;
      });
      setUnreadByUser(unreadMap);
    } catch (error) {
      console.error('Kullanıcı bazlı okunmamış mesaj hatası:', error);
    }
  };

  const handleUserClick = (userId) => {
    navigate('/messages', { state: { selectedUserId: userId } });
    setOpen(false);
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#1976d2', '#dc004e', '#9c27b0', '#f57c00', 
      '#388e3c', '#d32f2f', '#0288d1', '#7b1fa2'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease'
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={9}>
          <ChatIcon />
        </Badge>
      </Fab>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        TransitionComponent={Transition}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '80vh'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            <Typography variant="h6" component="div" fontWeight="bold">
              Yeni Sohbet
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Kişi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        {/* User List */}
        <DialogContent sx={{ p: 0 }}>
          {filteredUsers.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 2
              }}
            >
              <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Kullanıcı bulunamadı
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {filteredUsers.map((user, index) => (
                <ListItem
                  key={user._id}
                  disablePadding
                  sx={{
                    borderBottom: index !== filteredUsers.length - 1 ? 1 : 0,
                    borderColor: 'divider'
                  }}
                >
                  <ListItemButton
                    onClick={() => handleUserClick(user._id)}
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={unreadByUser[user._id] || 0}
                        color="error"
                        max={9}
                        overlap="circular"
                      >
                        <Avatar
                          sx={{
                            bgcolor: getAvatarColor(user.firstName),
                            width: 48,
                            height: 48,
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={600}>
                          {user.firstName} {user.lastName}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          {user.role === 'admin' ? (
                            <>
                              <AdminIcon sx={{ fontSize: 16, color: 'purple' }} />
                              <Typography variant="caption" color="text.secondary">
                                Yönetici
                              </Typography>
                            </>
                          ) : (
                            <>
                              <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="caption" color="text.secondary">
                                Kullanıcı
                              </Typography>
                            </>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        {/* Footer Button */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'grey.50'
          }}
        >
          <Box
            onClick={() => {
              navigate('/messages');
              setOpen(false);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 1.5,
              px: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 3
              }
            }}
          >
            <SendIcon />
            <Typography variant="body2" fontWeight={600}>
              Tüm Mesajları Görüntüle
            </Typography>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default FloatingChatButton;