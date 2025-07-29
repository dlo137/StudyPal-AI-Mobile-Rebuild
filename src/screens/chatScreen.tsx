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
import { supabase } from '../lib/supabase';


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
  { id: '1', text: 'Hi! How can I help you today?', sender: 'ai' },
  { id: '2', text: 'What is the capital of France?', sender: 'user' },
  { id: '3', text: 'The capital of France is Paris.', sender: 'ai' },
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
  // Animated dots for AI thinking
  const [isThinking, setIsThinking] = useState(false);
  const dotAnim = useRef(new Animated.Value(0)).current;
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const userName = route?.params?.userName;
  const inputRef = useRef<TextInput>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(DUMMY_MESSAGES);
  const [uploading, setUploading] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<{ uri: string; type?: string; fileName?: string } | null>(null);
  const [planType, setPlanType] = useState<'free' | 'gold' | 'diamond' | null>(null);
  const [questionsLeft, setQuestionsLeft] = useState<number | 'error' | null>(null);
  // Fetch user plan and question usage
  async function fetchPlanAndUsage() {
    if (!user) {
      setPlanType(null);
      setQuestionsLeft(null);
      return;
    }
    try {
      // Get plan type
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', user.id)
        .maybeSingle();
      console.debug('[fetchPlanAndUsage] profileData:', profileData, 'profileError:', profileError);
      if (profileError) {
        console.log('❌ Error fetching user plan:', profileError.message);
        setPlanType(null);
        setQuestionsLeft(null);
        return;
      }
      if (profileData && profileData.plan_type) {
        const plan = String(profileData.plan_type).toLowerCase();
        setPlanType(plan === 'gold' || plan === 'diamond' ? plan : 'free');
        // Get current month in YYYY-MM format
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        console.debug('[fetchPlanAndUsage] monthKey:', monthKey);
        // Query monthly_usage for this user and month using date column
        // Assumes date column is in YYYY-MM-DD format
        const { data: usageData, error: usageError } = await supabase
          .from('monthly_usage')
          .select('questions_asked')
          .eq('user_id', user.id)
          .gte('date', `${monthKey}-01`)
          .lte('date', `${monthKey}-31`);
        console.debug('[fetchPlanAndUsage] usageData:', usageData, 'usageError:', usageError);
        if (usageError) {
          console.log('❌ Error fetching monthly usage:', usageError.message);
          setQuestionsLeft('error');
        } else {
          // Sum all rows for the month
          let used = 0;
          if (usageData && Array.isArray(usageData)) {
            used = usageData.reduce((acc, row) => acc + (row.questions_asked || 0), 0);
          }
          const limit = PLAN_LIMITS[plan === 'gold' || plan === 'diamond' ? plan : 'free'];
          console.debug('[fetchPlanAndUsage] used:', used, 'limit:', limit, 'questionsLeft:', limit - used >= 0 ? limit - used : 0);
          // Always show 0 if at or above limit
          setQuestionsLeft(limit - used >= 0 ? limit - used : 0);
        }
      } else {
        console.log('❌ No plan_type found for user:', user.id);
        setPlanType(null);
        setQuestionsLeft(null);
      }
    } catch (err) {
      console.log('❌ Exception fetching user plan:', err);
      setPlanType(null);
      setQuestionsLeft(null);
    }
  }

  useEffect(() => {
    fetchPlanAndUsage();
  }, [user, messages]);
  // FlatList ref for auto-scrolling
  const flatListRef = useRef<FlatListType<any>>(null);
  // Send file/image if preview is present
  async function sendPendingPreview() {
    if (!pendingPreview) return;
    setUploading(true);
    // Show preview in chat
    const fileMsg = {
      id: Date.now().toString(),
      text: '', // Hide image filename from chat bubble
      sender: 'user',
      image: pendingPreview.uri,
    };
    // If this is the first message, clear dummy messages and start chat
    setMessages(prev => {
      if (
        prev.length === DUMMY_MESSAGES.length &&
        prev.every((m, i) => m.id === DUMMY_MESSAGES[i].id)
      ) {
        setHasStarted(true);
        return [fileMsg];
      }
      return [...prev, fileMsg];
    });
    // Always start chat if not started
    if (!hasStarted) setHasStarted(true);
    // Clear image preview immediately after sending
    setPendingPreview(null);
    // Send to AI for analysis (send a message describing the file)
    let fileDesc = 'Please analyze this image and solve the problem if presented with one.';
    // Prepare chat history
    let chatHistory = [
      ...messages.filter(m => m.sender === 'user' || m.sender === 'ai').map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: fileDesc },
    ];
    // If this is the first message, don't include dummy messages
    if (
      messages.length === DUMMY_MESSAGES.length &&
      messages.every((m, i) => m.id === DUMMY_MESSAGES[i].id)
    ) {
      chatHistory = [{ role: 'user', content: fileDesc }];
    }
    if (selectedSubject) {
      chatHistory = [
        {
          role: 'system',
          content: `You are a friendly, knowledgeable AI tutor who is an expert in ${selectedSubject}. The user has uploaded a file or image. If it is an image, you must describe the image in detail, analyze its content, and solve or answer any problems or questions shown in the image. If you cannot see the image, ask the user to describe it or upload text instead. Be helpful, concise, and encouraging.`
        },
        ...chatHistory
      ];
    }
    // Show animated thinking indicator
    setIsThinking(true);
    try {
      const aiText = await getAIResponse(chatHistory);
      setIsThinking(false);
      setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), text: aiText, sender: 'ai' }]);
    } catch (err) {
      setIsThinking(false);
      setMessages(prev => [...prev, { id: (Date.now() + 3).toString(), text: 'Sorry, there was an error analyzing the file.', sender: 'ai' }]);
    }
    setUploading(false);
  }

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

  // Send file/image if preview is present
  async function sendPendingPreview() {
    if (!pendingPreview) return;
    setUploading(true);
    // Show preview in chat
    const fileMsg = {
      id: Date.now().toString(),
      text: pendingPreview.fileName || pendingPreview.uri.split('/').pop() || 'Uploaded file',
      sender: 'user',
      image: pendingPreview.uri,
    };
    setMessages(prev => [...prev, fileMsg]);
    // Send to AI for analysis (send a message describing the file)
    let fileDesc = 'I have uploaded a file.';
    if (pendingPreview.type?.startsWith('image')) {
      fileDesc = 'I have uploaded an image. Please analyze or answer questions about it.';
    }
    // Prepare chat history
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
    try {
      const aiText = await getAIResponse(chatHistory);
      const aiMsg = { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 2).toString(), text: 'Sorry, there was an error analyzing the file.', sender: 'ai' }
      ]);
    }
    setUploading(false);
    setPendingPreview(null);
  }
    } catch (e) {
      setUploading(false);
      alert('Error uploading file.');
    }
  };
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false); // tracks if user has submitted
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Handler to reset chat
  const startNewChat = () => {
    setMessages(DUMMY_MESSAGES);
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
  const subjectAnimRefs = useRef(Array(11).fill(0).map(() => new Animated.Value(0))).current;

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

    // Always fetch latest plan and usage before sending
    let latestPlanType = planType;
    let latestQuestionsLeft = questionsLeft;
    let latestQuestionsUsed = 0;
    if (user) {
      try {
        // Get plan_type from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('plan_type')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) {
          console.log('❌ Error fetching plan_type:', profileError);
          alert('Error checking your plan. Please try again.');
          return;
        }
        if (profileData && profileData.plan_type) {
          latestPlanType = String(profileData.plan_type).toLowerCase() as 'free' | 'gold' | 'diamond' | null;
          if (latestPlanType === 'gold' || latestPlanType === 'diamond') {
            // Only query daily_usage for gold/diamond
            const { data: usageData, error: usageError } = await supabase
              .from('daily_usage')
              .select('questions_asked')
              .eq('user_id', user.id)
              .maybeSingle();
            if (usageError) {
              console.log('❌ Error fetching usage:', usageError);
              alert('Error checking your usage. Please try again.');
              return;
            }
            const limit = PLAN_LIMITS[latestPlanType];
            // If no row exists, treat as zero used
            latestQuestionsUsed = (usageData && typeof usageData.questions_asked === 'number') ? usageData.questions_asked : 0;
            latestQuestionsLeft = limit - latestQuestionsUsed;
          } else if (latestPlanType === 'free') {
            // For free plan, track monthly usage in AsyncStorage
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
                }
              }
            } catch (storageErr) {
              console.log('❌ Error reading AsyncStorage for free plan usage:', storageErr);
            }
            latestQuestionsUsed = freeUsage.count;
            latestQuestionsLeft = PLAN_LIMITS.free - latestQuestionsUsed;
          } else {
            latestQuestionsLeft = null;
          }
        } else {
          // No profile row: treat as free plan
          latestPlanType = 'free';
          // Use AsyncStorage for monthly tracking
          const now = new Date();
          const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
          let freeUsage = { month: monthKey, count: 0 };
          try {
            const stored = await AsyncStorage.getItem('free_plan_usage');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.month === monthKey) {
                freeUsage = parsed;
              }
            }
          } catch (storageErr) {
            console.log('❌ Error reading AsyncStorage for free plan usage:', storageErr);
          }
          latestQuestionsUsed = freeUsage.count;
          latestQuestionsLeft = PLAN_LIMITS.free - latestQuestionsUsed;
        }
      } catch (err) {
        console.log('❌ Exception in plan/usage check:', err);
        alert('Error checking your plan. Please try again.');
        return;
      }
    }

    // Enforce limits: allow sending, but always append warning if at limit
    let limitWarning: string | null = null;
    if (
      latestPlanType === 'free' &&
      typeof latestQuestionsLeft === 'number' &&
      latestQuestionsLeft <= 0
    ) {
      limitWarning = '⚠️ You have reached the free plan limit of 5 questions for this month. Upgrade to Gold (150 questions) or Diamond (500 questions) for more monthly questions!';
    } else if (
      latestPlanType === 'gold' &&
      typeof latestQuestionsLeft === 'number' &&
      latestQuestionsLeft <= 0
    ) {
      limitWarning = '⚠️ You have reached your Gold plan limit of 150 questions. Upgrade to Diamond (500 questions) for more daily questions!';
    } else if (
      latestPlanType === 'diamond' &&
      typeof latestQuestionsLeft === 'number' &&
      latestQuestionsLeft <= 0
    ) {
      limitWarning = '⚠️ You have reached your Diamond plan limit of 500 questions. Your limit will reset tomorrow.';
    }

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
      if (limitWarning) {
        newMsgs = [
          ...newMsgs,
          {
            id: (Date.now() + 3).toString(),
            text: limitWarning,
            sender: 'ai'
          }
        ];
      }
      return newMsgs;
    });
    setInput('');
    setHasStarted(true);

    // For free plan, update questionsLeft immediately (but don't increment if at limit)
    if (latestPlanType === 'free' && (!limitWarning)) {
      // Update monthly usage in AsyncStorage
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      let freeUsage = { month: monthKey, count: 0 };
      try {
        const stored = await AsyncStorage.getItem('free_plan_usage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.month === monthKey) {
            freeUsage = parsed;
          }
        }
      } catch (storageErr) {
        console.log('❌ Error reading AsyncStorage for free plan usage:', storageErr);
      }
      freeUsage.count += 1;
      try {
        await AsyncStorage.setItem('free_plan_usage', JSON.stringify(freeUsage));
      } catch (storageErr) {
        console.log('❌ Error writing AsyncStorage for free plan usage:', storageErr);
      }
      setQuestionsLeft(PLAN_LIMITS.free - freeUsage.count);
    } else if ((latestPlanType === 'gold' || latestPlanType === 'diamond') && (!limitWarning)) {
      setQuestionsLeft(
        typeof latestQuestionsLeft === 'number' ? latestQuestionsLeft - 1 : latestQuestionsLeft
      );
    }
    setPlanType(latestPlanType);

    // Only call AI if not at limit
    if (!limitWarning) {
      try {
        // Prepare chat history for OpenAI
        let chatHistory = [
          ...messages.filter(m => m.sender === 'user' || m.sender === 'ai').map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: trimmed }
        ];
        // If a subject is selected, prepend a system prompt
        if (selectedSubject) {
          chatHistory = [
            {
              role: 'system',
              content: `You are a friendly, knowledgeable AI tutor who is an expert in ${selectedSubject}. Your job is to help students understand and solve their homework problems in this subject.\n\nBe accurate, up-to-date, and clear.\n\nStart by explaining key concepts or steps briefly before solving the problem.\n\nKeep answers compact but not shallow — Give the answer, but teach afterwards as well\n\nSpeak like a smart, encouraging tutor or helpful study buddy.\n\nIf there’s a mistake in the student’s question or reasoning, kindly correct it and guide them to the right thinking.\n\nAvoid fluff. Get to the point, explain clearly, and help them learn fast.`
            },
            ...chatHistory
          ];
        }
        // Show animated thinking indicator
        setIsThinking(true);
        const aiText = await getAIResponse(chatHistory);
        setIsThinking(false);
        setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), text: aiText, sender: 'ai' }]);
      } catch (err) {
        setIsThinking(false);
        setMessages(prev => [...prev, { id: (Date.now() + 3).toString(), text: 'Sorry, there was an error getting a response.', sender: 'ai' }]);
      }
    }
  };

  // Header with questions left
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <Header
        hidePlus={false}
        hideBranding={false}
        onSignInPress={startNewChat}
        rightContent={
          planType === 'free' && questionsLeft !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Ionicons name="help-circle" size={18} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                {questionsLeft === 'error' ? 'Error' : `${questionsLeft}/5 left`}
              </Text>
            </View>
          ) : planType === 'gold' && questionsLeft !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Ionicons name="help-circle" size={18} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                {questionsLeft === 'error' ? 'Error' : `${questionsLeft}/150 left`}
              </Text>
            </View>
          ) : planType === 'diamond' && questionsLeft !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Ionicons name="help-circle" size={18} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                {questionsLeft === 'error' ? 'Error' : `${questionsLeft}/500 left`}
              </Text>
            </View>
          ) : null
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
                <TouchableOpacity style={styles.iconBtn} onPress={handleAttachPress} disabled={uploading || !!pendingPreview}>
                  <Ionicons name="attach" size={22} color={uploading || pendingPreview ? theme.accent : theme.textSecondary} />
                </TouchableOpacity>
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
