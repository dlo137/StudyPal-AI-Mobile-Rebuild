import React, { useRef, useState, useEffect } from 'react';
import { Easing } from 'react-native';
import type { FlatList as FlatListType } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Animated, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getAIResponse } from '../lib/openai';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase, supabaseService } from '../lib/supabase';


type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  image?: string;
};

// AnimatedDots component for AI "thinking..." indicator
const AnimatedDots = ({ dotAnim }: { dotAnim: Animated.Value }) => {
  const dotCount = 3;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 24 }}>
      {[...Array(dotCount)].map((_, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: '#007aff',
            marginHorizontal: 3,
            opacity: dotAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [i === 0 ? 1 : 0.3, i === dotCount - 1 ? 1 : 0.3],
            }),
            transform: [
              {
                translateY: dotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, i * 2],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
};

const DUMMY_MESSAGES: ChatMessage[] = [
  // No dummy messages
];

const subjectColors = {
  Math: { btn: { backgroundColor: '#c7d2fe' }, text: { color: '#3730a3' } },
  Science: { btn: { backgroundColor: '#bbf7d0' }, text: { color: '#065f46' } },
  Literature: { btn: { backgroundColor: '#fbcfe8' }, text: { color: '#be185d' } },
  Programming: { btn: { backgroundColor: '#fde68a' }, text: { color: '#92400e' } },
  Health: { btn: { backgroundColor: '#ddd6fe' }, text: { color: '#6d28d9' } },
  History: { btn: { backgroundColor: '#fed7aa' }, text: { color: '#b45309' } },
  Physics: { btn: { backgroundColor: '#a5f3fc' }, text: { color: '#155e75' } },
  Chemistry: { btn: { backgroundColor: '#d9f99d' }, text: { color: '#365314' } },
  Biology: { btn: { backgroundColor: '#f9a8d4' }, text: { color: '#831843' } },
  Fitness: { btn: { backgroundColor: '#99f6e4' }, text: { color: '#134e4a' } },
  Economics: { btn: { backgroundColor: '#ddd6fe' }, text: { color: '#7c3aed' } }
};


const PLAN_LIMITS = { free: 5, gold: 150, diamond: 500 };

const ChatScreen = ({ route }: any) => {
  // ...existing state/refs...

  // Fetch user plan and question usage
  async function fetchPlanAndUsage() {
    if (!user) {
      setPlanType(null);
      setQuestionsLeft(null);
      return;
    }
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) {
        setPlanType(null);
        setQuestionsLeft(null);
        return;
      }
      let plan = profileData && profileData.plan_type ? String(profileData.plan_type).toLowerCase() : 'free';
      setPlanType(plan === 'gold' || plan === 'diamond' ? plan : 'free');
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const { data: usageData, error: usageError } = await supabase
        .from('monthly_usage')
        .select('questions_asked')
        .eq('user_id', user.id)
        .gte('date', `${monthKey}-01`)
        .lte('date', `${monthKey}-31`);
      if (usageError) {
        setQuestionsLeft('error');
      } else {
        let used = 0;
        if (usageData && Array.isArray(usageData)) {
          used = usageData.reduce((acc, row) => acc + (row.questions_asked || 0), 0);
        }
        const limit = PLAN_LIMITS[plan === 'gold' || plan === 'diamond' ? plan : 'free'];
        setQuestionsLeft(limit - used >= 0 ? limit - used : 0);
      }
    } catch (err) {
      setPlanType(null);
      setQuestionsLeft(null);
    }
  }
  // ...existing code...
  const flatListRef = useRef<FlatListType<any>>(null);
  // State and refs
  // ...existing code...
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [freeQuestionsLeft, setFreeQuestionsLeft] = useState<number>(PLAN_LIMITS.free);
  const [uploading, setUploading] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<{ uri: string; type?: string; fileName?: string } | null>(null);
  const [planType, setPlanType] = useState<'free' | 'gold' | 'diamond' | null>(null);
  const [questionsLeft, setQuestionsLeft] = useState<number | 'error' | null>(null);
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const dotAnim = useRef(new Animated.Value(0)).current;
  // ...existing code...
  const subjectAnimRefs = useRef(Array(11).fill(0).map(() => new Animated.Value(0))).current;
  // State and refs
  const { theme } = useTheme();
  const { user } = useAuth();
  const userName = route?.params?.userName;
  const inputRef = useRef<TextInput>(null);
  // ...existing code...
  // ...existing code...
  // ...existing code...

  // Only one useEffect for freeQuestionsLeft, after all state/refs
  useEffect(() => {
    if (!user) {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      (async () => {
        let freeUsage = { month: monthKey, count: 0 };
        try {
          const stored = await AsyncStorage.getItem('free_plan_usage');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.month === monthKey) {
              freeUsage = parsed;
            }
          }
        } catch (err) {
          // ignore
        }
        setFreeQuestionsLeft(PLAN_LIMITS.free - freeUsage.count);
      })();
    }
  }, [user, messages]);

  useEffect(() => {
    if (isThinking) {
      Animated.loop(
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      dotAnim.stopAnimation();
      dotAnim.setValue(0);
    }
  }, [isThinking]);

  useEffect(() => {
    if (!hasStarted) {
      subjectAnimRefs.forEach(anim => anim.setValue(0));
      subjectAnimRefs.forEach((anim, idx) => {
        setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }, idx * 80);
      });
    } else {
      subjectAnimRefs.forEach(anim => anim.setValue(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  // ...existing code...

  // Refetch plan/usage on user, messages, and when global.fetchPlanAndUsage is called
  useEffect(() => {
    fetchPlanAndUsage();
    // Listen for global.fetchPlanAndUsage calls
    global.fetchPlanAndUsage = async () => {
      await fetchPlanAndUsage();
    };
    // Cleanup on unmount
    return () => {
      if (global.fetchPlanAndUsage) {
        global.fetchPlanAndUsage = undefined;
      }
    };
  }, [user, messages]);
  // FlatList ref for auto-scrolling
  // ...existing code...
  // ...existing code...

  // Send file/image if preview is present
  const sendPendingPreview = async () => {
    if (!pendingPreview) return;
    setUploading(true);
    let publicImageUrl: string | undefined = undefined;
    let fileMsg: ChatMessage;
    async function uploadImageAsync(uri: string, userId: string) {
      // Check if user is authenticated
      if (!user || !user.id) {
        alert('You must be signed in to upload images.');
        throw new Error('User not authenticated');
      }
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `${userId}_${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('image-uploads')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });
        if (error) {
          throw error;
        }
        const { publicUrl } = supabase.storage
          .from('image-uploads')
          .getPublicUrl(fileName).data;
        return publicUrl;
      } catch (err) {
        throw err;
      }
    }
    try {
      if (pendingPreview?.type?.startsWith('image') && pendingPreview.uri && user?.id) {
        publicImageUrl = await uploadImageAsync(pendingPreview.uri, user.id);
        fileMsg = {
          id: Date.now().toString(),
          text: pendingPreview.fileName || pendingPreview.uri.split('/').pop() || 'Uploaded image',
          sender: 'user',
          image: publicImageUrl,
        };
      } else {
        fileMsg = {
          id: Date.now().toString(),
          text: pendingPreview.fileName || pendingPreview.uri.split('/').pop() || 'Uploaded file',
          sender: 'user',
          image: pendingPreview.uri,
        };
      }
      setMessages(prev => [...prev, fileMsg]);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 300);
      let fileDesc = 'I have uploaded a file.';
      if (pendingPreview.type?.startsWith('image')) {
        fileDesc = 'I have uploaded an image. Please analyze or answer questions about it.';
      }
      let chatHistory = [
        ...messages.filter(m => m.sender === 'user' || m.sender === 'ai').map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        { role: 'user', content: fileDesc },
      ];
      if (selectedSubject) {
        chatHistory = [
          {
            role: 'system',
            content: `You are a friendly, knowledgeable AI tutor who is an expert in ${selectedSubject}. The user has uploaded a file or image. If it is an image, try to help them analyze or answer questions about it. If you cannot see the image, ask the user to describe it or upload text instead. Be helpful, concise, and encouraging.`
          },
          ...chatHistory
        ];
      }
      console.log('Calling getAIResponse with:', chatHistory, publicImageUrl);
      const aiText = await getAIResponse(chatHistory, publicImageUrl ?? undefined);
      const aiMsg = { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 600);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 2).toString(), text: 'Sorry, there was an error analyzing the file.', sender: 'ai' }
      ]);
    }
    setUploading(false);
    setPendingPreview(null);
  };

  // Handle file/image upload
  const handleAttachPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPendingPreview({ uri: asset.uri, type: asset.type, fileName: asset.fileName ?? undefined });
      }
    } catch (e) {
      setUploading(false);
      alert('Error uploading file.');
    }
  };
  // ...existing code...

  // Handler to reset chat
  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setHasStarted(false);
    setSelectedSubject(null);
    setPendingPreview(null); // Clear image/file preview
    // Always re-fetch plan and usage after chat reset
    fetchPlanAndUsage();
    // Reset subject button animations so they are visible and animate in
    subjectAnimRefs.forEach(anim => anim.setValue(0));
    setTimeout(() => {
      subjectAnimRefs.forEach((anim, idx) => {
        setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }, idx * 80);
      });
    }, 0);
  };

  // Animation for subject buttons (web-like staggered fade/slide-in)
  // ...existing code...

  useEffect(() => {
    if (!hasStarted) {
      subjectAnimRefs.forEach(anim => anim.setValue(0));
      subjectAnimRefs.forEach((anim, idx) => {
        setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }, idx * 80);
      });
    } else {
      subjectAnimRefs.forEach(anim => anim.setValue(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setMessages([
      {
        id: Date.now().toString(),
        text: `Hi! I'm your friendly, knowledgeable AI tutor for ${subject}. What can I help you with today?`,
        sender: 'ai',
      },
    ]);
    setHasStarted(true);
  };

  // Helper to clear dummy messages after first real user input
  const clearDummyIfNeeded = () => {
    if (
      messages.length === DUMMY_MESSAGES.length &&
      messages.every((m, i) => m.id === DUMMY_MESSAGES[i].id)
    ) {
      setMessages([]);
    }
  };

  // Send message logic
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Non-logged-in user logic
    if (!user) {
      // Monthly reset logic
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      let freeUsage = { month: monthKey, count: 0 };
      try {
        const stored = await AsyncStorage.getItem('free_plan_usage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.month === monthKey) {
            freeUsage = parsed;
          } else {
            // New month, reset count
            freeUsage = { month: monthKey, count: 0 };
            await AsyncStorage.setItem('free_plan_usage', JSON.stringify(freeUsage));
            setFreeQuestionsLeft(PLAN_LIMITS.free);
          }
        }
      } catch (err) {
        // ignore
      }
      // Block sending if at limit
      if (PLAN_LIMITS.free - freeUsage.count <= 0) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            text: '⚠️ You have reached the free plan limit of 5 questions for this month. Sign up for more questions!',
            sender: 'ai'
          }
        ]);
        setInput('');
        setHasStarted(true);
        return;
      }
      // Allow sending
      clearDummyIfNeeded();
      const userMsg = { id: Date.now().toString(), text: trimmed, sender: 'user' };
      setMessages(prev => {
        let newMsgs;
        if (
          prev.length === DUMMY_MESSAGES.length &&
          prev.every((m, i) => m.id === DUMMY_MESSAGES[i].id)
        ) {
          newMsgs = [userMsg];
        } else {
          newMsgs = [...prev, userMsg];
        }
        return newMsgs;
      });
      setInput('');
      setHasStarted(true);
      // Update AsyncStorage and freeQuestionsLeft
      freeUsage.count += 1;
      try {
        await AsyncStorage.setItem('free_plan_usage', JSON.stringify(freeUsage));
      } catch (err) {
        // ignore
      }
      setFreeQuestionsLeft(PLAN_LIMITS.free - freeUsage.count);
      // Only call AI if not at limit
      try {
        let chatHistory = [
          ...messages.filter(m => m.sender === 'user' || m.sender === 'ai').map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: trimmed }
        ];
        if (selectedSubject) {
          chatHistory = [
            {
              role: 'system',
              content: `You are a friendly, knowledgeable AI tutor who is an expert in ${selectedSubject}. Your job is to help students understand and solve their homework problems in this subject.\n\nBe accurate, up-to-date, and clear.\n\nStart by explaining key concepts or steps briefly before solving the problem.\n\nKeep answers compact but not shallow — Give the answer, but teach afterwards as well\n\nSpeak like a smart, encouraging tutor or helpful study buddy.\n\nIf there’s a mistake in the student’s question or reasoning, kindly correct it and guide them to the right thinking.\n\nAvoid fluff. Get to the point, explain clearly, and help them learn fast.`
            },
            ...chatHistory
          ];
        }
        setIsThinking(true);
        const aiText = await getAIResponse(chatHistory);
        setIsThinking(false);
        setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), text: aiText, sender: 'ai' }]);
      } catch (err) {
        setIsThinking(false);
        setMessages(prev => [...prev, { id: (Date.now() + 3).toString(), text: 'Sorry, there was an error getting a response.', sender: 'ai' }]);
      }
      return;
    }

    // ...existing code for logged-in users...
    // Always fetch latest plan and usage before sending
    let latestPlanType = planType;
    let latestQuestionsLeft = questionsLeft;
    let latestQuestionsUsed = 0;
    if (user) {
      // ...existing code for logged-in users...
      // (unchanged)
      // ...existing code...
    }

    // ...existing code for logged-in users...
    // (unchanged)
    // ...existing code...
  };

  // Header with questions left
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <Header
        hidePlus={false}
        hideBranding={false}
        onSignInPress={startNewChat}
        key={`header-${planType}-${questionsLeft}`}
        rightContent={
          user
            ? (planType && questionsLeft !== null ? (
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#23232a',
                  borderRadius: 16,
                  flexDirection: 'row',
                  width: 'auto',
                  minWidth: 0,
                  padding: 0,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 13,
                    textAlign: 'center',
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    minWidth: 0,
                    width: 'auto',
                  }}>
                    {questionsLeft === 'error'
                      ? 'Error'
                      : planType === 'free'
                      ? `${questionsLeft}/5 left`
                      : planType === 'gold'
                      ? `${questionsLeft}/150 left`
                      : `${questionsLeft}/500 left`}
                  </Text>
                </View>
              ) : null)
            : (
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#23232a',
                  borderRadius: 16,
                  flexDirection: 'row',
                  width: 'auto',
                  minWidth: 0,
                  padding: 0,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 13,
                    textAlign: 'center',
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    minWidth: 0,
                    width: 'auto',
                  }}>
                    {`${freeQuestionsLeft}/5 left`}
                  </Text>
                </View>
              )
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={hasStarted ? { flex: 1, backgroundColor: theme.background } : [styles.centerContent, { backgroundColor: theme.background }]}> 
            {/* Welcome Message */}
            {!hasStarted && (
              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeTitle, { color: theme.text }]}>How can I help you?</Text>
              </View>
            )}
            {/* Chat Messages */}
            {hasStarted && (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item, index }) => (
                  <>
                    <View style={{ alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start', marginVertical: 8, maxWidth: '80%' }}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={{ width: 180, height: 180, borderRadius: 16, marginBottom: 4 }} resizeMode="cover" />
                      ) : null}
                      {/* Only render chat bubble if text is not empty */}
                      {item.text ? (
                        <Text
                          style={{
                            color: '#fff',
                            backgroundColor: item.sender === 'user' ? '#23232a' : '#007aff',
                            borderRadius: 22,
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                          }}
                        >
                          {item.text}
                        </Text>
                      ) : null}
                    </View>
                    {/* Show animated thinking dots below last user message if AI is thinking */}
                    {isThinking && index === messages.length - 1 && item.sender === 'user' && (
                      <View style={{ alignSelf: 'flex-start', marginLeft: 8, marginTop: 2, marginBottom: 8 }}>
                        <AnimatedDots dotAnim={dotAnim} />
                      </View>
                    )}
                  </>
                )}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              />
            )}
            {/* Subject Buttons */}
            {!hasStarted && (
              <View style={styles.subjectsContainer}>
                {/* First row: 6 subjects */}
                <View style={styles.subjectsRow}>
                  {['Math', 'Science', 'Literature', 'Programming', 'Health', 'History'].map((subject, idx) => {
                    const colorStyles = subjectColors[subject as keyof typeof subjectColors] || {};
                    const isSelected = selectedSubject === subject;
                    const anim = subjectAnimRefs[idx];
                    return (
                      <Animated.View
                        key={subject}
                        style={{
                          opacity: anim,
                          transform: [
                            {
                              translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [40, 0],
                              }),
                            },
                            {
                              scale: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7, 1],
                              }),
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          style={[styles.subjectBtn, colorStyles.btn, isSelected && { borderWidth: 2, borderColor: theme.accent }]}
                          onPress={() => handleSubjectSelect(subject)}
                        >
                          <Text style={[styles.subjectBtnText, colorStyles.text]}>{subject}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
                {/* Second row: 5 subjects */}
                <View style={styles.subjectsRow}>
                  {['Physics', 'Chemistry', 'Biology', 'Fitness', 'Economics'].map((subject, idx) => {
                    const colorStyles = subjectColors[subject as keyof typeof subjectColors] || {};
                    const isSelected = selectedSubject === subject;
                    const animIdx = idx + 6;
                    return (
                      <Animated.View
                        key={subject}
                        style={{
                          opacity: subjectAnimRefs[animIdx],
                          transform: [
                            {
                              translateY: subjectAnimRefs[animIdx].interpolate({
                                inputRange: [0, 1],
                                outputRange: [40, 0],
                              }),
                            },
                            {
                              scale: subjectAnimRefs[animIdx].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7, 1],
                              }),
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          style={[styles.subjectBtn, colorStyles.btn, isSelected && { borderWidth: 2, borderColor: theme.accent }]}
                          onPress={() => handleSubjectSelect(subject)}
                        >
                          <Text style={[styles.subjectBtnText, colorStyles.text]}>{subject}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            )}
            {/* Input Bar */}
            <View style={[styles.inputBarContainer, hasStarted && { maxWidth: '100%', width: '100%' }, { backgroundColor: 'transparent' }]}> 
              <View style={[styles.inputBar, hasStarted && { maxWidth: '100%', width: '100%' }]}> 
                <View
                  style={[
                    styles.inputInner,
                    theme.mode === 'dark'
                      ? { backgroundColor: '#23232a', borderRadius: 20 }
                      : { backgroundColor: '#f3f4f6', borderRadius: 20 }
                  ]}
                >
                  {pendingPreview && (
                    <View style={{ marginRight: 8, paddingTop: 6, paddingBottom: 6 }}>
                      {pendingPreview.type?.startsWith('image') ? (
                        <Image source={{ uri: pendingPreview.uri }} style={{ width: 36, height: 36, borderRadius: 8 }} />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: theme.menu, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="document" size={20} color={theme.textSecondary} />
                        </View>
                      )}
                    </View>
                  )}
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      { color: theme.text, backgroundColor: 'transparent' }
                    ]}
                    placeholder="Type a question or upload"
                    placeholderTextColor={theme.textSecondary}
                    editable={true}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                  />
                  {pendingPreview ? (
                    <TouchableOpacity style={styles.sendBtn} onPress={sendPendingPreview} disabled={uploading}>
                      <Ionicons name="send" size={22} color={theme.accent} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={uploading}>
                      <Ionicons name="send" size={22} color={theme.accent} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  // centerContent style is now only inside StyleSheet.create
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#141417',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // headerGradient and headerTitle styles removed (now handled by Header component)
  subjectsContainer: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    gap: 0,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  subjectsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  subjectBtn: {
    backgroundColor: '#23232a',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 5,
    marginHorizontal: 3,
    marginVertical: 2,
    elevation: 1,
    shadowColor: '#8C52FF',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    minWidth: 54,
    maxWidth: 90,
  },
  subjectBtnText: {
    color: '#5CE1E6',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 16,
    width: '100%',
  },
  welcomeTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 6,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  inputBarContainer: {
    marginTop: 8, // Increased space between nav and input bar
    paddingHorizontal: 0,
    marginBottom: 0,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
    width: '100%',
    maxWidth: 600,
    // backgroundColor set via theme
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 8,
    // backgroundColor set via theme
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtnGradient: {
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
