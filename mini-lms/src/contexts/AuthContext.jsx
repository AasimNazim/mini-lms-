import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isUsingPlaceholder } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount for mocks
  useEffect(() => {
    if (isUsingPlaceholder) {
      const storedUser = sessionStorage.getItem('mockCurrentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setUserRole(parsed.role);
      }
      setLoading(false);
    }
  }, []);

  // Mock implementation for when Firebase is not configured
  const mockLogin = async (email, password) => {
    console.log("Mock login triggered due to placeholder credentials.");
    // Find user in localStorage
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const existingUser = users.find(u => u.email === email);
    
    let role = 'student';
    let status = 'Active';
    let userForSession = existingUser;
    if (existingUser) {
      role = existingUser.role;
      status = existingUser.status || 'Active';
      if (status === 'Suspended') throw new Error("Account is suspended.");
    } else {
      if (email.includes('admin')) role = 'admin';
      if (email.includes('instructor')) role = 'instructor';
      const newUser = { id: Math.random().toString(36).substr(2, 9), email, role, status: 'Active' };
      users.push(newUser);
      localStorage.setItem('mockUsers', JSON.stringify(users));
      userForSession = newUser;
    }
    
    const mockUser = { uid: userForSession.id, email, role };
    setCurrentUser(mockUser);
    setUserRole(role);
    sessionStorage.setItem('mockCurrentUser', JSON.stringify(mockUser));
    return mockUser;
  };

  const mockSignup = async (email, password, role) => {
    console.log("Mock signup triggered due to placeholder credentials.");
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    if (users.find(u => u.email === email)) throw new Error("Email already in use");

    const mockUser = { id: Math.random().toString(36).substr(2, 9), email, role, status: 'Active' };
    users.push(mockUser);
    localStorage.setItem('mockUsers', JSON.stringify(users));
    
    const currentUserObj = { uid: mockUser.id, email, role };
    setCurrentUser(currentUserObj);
    setUserRole(role);
    sessionStorage.setItem('mockCurrentUser', JSON.stringify(currentUserObj));
    return currentUserObj;
  };

  const mockLogout = async () => {
    setCurrentUser(null);
    setUserRole(null);
    sessionStorage.removeItem('mockCurrentUser');
  };

  async function signup(email, password, role) {
    let finalRole = role;
    // Hardcode the primary admin email
    if (email.toLowerCase() === 'admin@minilms.com') {
      finalRole = 'admin';
    } else if (role === 'admin') {
      throw new Error("Admin registration is restricted.");
    }

    if (isUsingPlaceholder) return mockSignup(email, password, finalRole);

    // Set persistence to session to avoid cross-tab state sharing
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      role: finalRole,
      status: 'Active',
      createdAt: new Date().toISOString()
    });
    setUserRole(finalRole);
    return userCredential.user;
  }

  async function login(email, password) {
    if (isUsingPlaceholder) return mockLogin(email, password);

    // Set persistence to session to avoid cross-tab state sharing
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Fetch user role
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.status === 'Suspended') {
        await signOut(auth);
        throw new Error("Account is suspended.");
      }
      setUserRole(userData.role);
    } else {
      setUserRole('student'); // Default fallback
    }
    return userCredential.user;
  }

  function logout() {
    if (isUsingPlaceholder) return mockLogout();
    return signOut(auth);
  }

  useEffect(() => {
    if (isUsingPlaceholder) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.status === 'Suspended') {
              await signOut(auth);
              setCurrentUser(null);
              setUserRole(null);
            } else {
              setCurrentUser(user);
              setUserRole(userData.role);
            }
          } else {
            setCurrentUser(user);
            setUserRole('student');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setCurrentUser(user);
          setUserRole('student');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
