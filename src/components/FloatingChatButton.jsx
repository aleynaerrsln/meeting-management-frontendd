import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
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
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { unreadMessagesCount } = useNotifications(); // ✅ Context'ten al
  
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [unreadByUser, setUnreadByUser] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Kullanıcı listesini çek
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/messages/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    }
  }, []);

  // ✅ Kullanıcı bazlı okunmamış mesaj sayıları
  const fetchUnreadByUser = useCallback(async () => {
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
  }, []);

  // ✅ İlk yükleme
  useEffect(() => {
    fetchUsers();
    fetchUnreadByUser();
  }, [fetchUsers, fetchUnreadByUser]);

  const handleUserClick = useCallback((userId) => {
    navigate('/messages', { state: { selectedUserId: userId } });
    setOpen(false);
  }, [navigate]);

  // ✅ Filtrelenmiş kullanıcılar - memoized
  const filteredUsers = useMemo(() => 
    users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]
  );

  const getInitials = useCallback((firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }, []);

  const getAvatarColor = useCallback((role) => {
    return role === 'admin' ? '#1976d2' : '#2e7d32';
  }, []);

  return (
    <>
      <Fab
        color="primary"
        aria-label="messages"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Badge badgeContent={unreadMessagesCount} color="error">
          <ChatIcon />
        </Badge>
      </Fab>

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            height: isMobile ? '100%' : '600px',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            Mesajlaşma
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <List sx={{ width: '100%' }}>
            {filteredUsers.map((user) => (
              <ListItem key={user._id} disablePadding>
                <ListItemButton 
                  onClick={() => handleUserClick(user._id)}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Badge 
                      badgeContent={unreadByUser[user._id] || 0} 
                      color="error"
                      overlap="circular"
                    >
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(user.role),
                          width: 48,
                          height: 48
                        }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        {user.role === 'admin' && (
                          <Chip
                            icon={<AdminIcon sx={{ fontSize: 14 }} />}
                            label="Admin"
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {user.departments?.join(', ') || 'Departman belirtilmemiş'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {filteredUsers.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingChatButton;