import React, { useRef, useState, useEffect } from 'react';
import type { FlatList as FlatListType } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Animated, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getAIResponse } from '../lib/openai';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  image?: string;
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


const ChatScreen = ({ route }: any) => {
  const { theme } = useTheme();
  const userName = route?.params?.userName;
  const inputRef = useRef<TextInput>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(DUMMY_MESSAGES);
  const [uploading, setUploading] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<{ uri: string; type?: string; fileName?: string } | null>(null);
  // FlatList ref for auto-scrolling
  const flatListRef = useRef<FlatListType<any>>(null);
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
    let fileDesc = 'I have uploaded a file. Please analyze, describe, or solve the content of this file. If it is an image, describe what you see and solve any problems or questions shown in the image.';
    if (pendingPreview.type?.startsWith('image')) {
      fileDesc = 'I have uploaded an image. Please describe the image in detail, analyze its content, and solve or answer any problems or questions shown in the image.';
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
          content: `You are a friendly, knowledgeable AI tutor who is an expert in ${selectedSubject}. The user has uploaded a file or image. If it is an image, you must describe the image in detail, analyze its content, and solve or answer any problems or questions shown in the image. If you cannot see the image, ask the user to describe it or upload text instead. Be helpful, concise, and encouraging.`
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
    clearDummyIfNeeded();
    const userMsg = { id: Date.now().toString(), text: trimmed, sender: 'user' };
    setMessages(prev => {
      if (
        prev.length === DUMMY_MESSAGES.length &&
        prev.every((m, i) => m.id === DUMMY_MESSAGES[i].id)
      ) {
        return [userMsg];
      }
      return [...prev, userMsg];
    });
    setInput('');
    setHasStarted(true);

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
      console.log('[DEBUG] OpenAI API Key:', Constants?.expoConfig?.extra?.OPENAI_API_KEY);
      console.log('[DEBUG] Sending chatHistory to OpenAI:', chatHistory);
      const aiText = await getAIResponse(chatHistory);
      console.log('[DEBUG] OpenAI response:', aiText);
      const aiMsg = { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      if (err instanceof Error) {
        console.log('[ERROR] OpenAI API error:', err.message, err.stack);
      } else {
        console.log('[ERROR] OpenAI API error:', err);
      }
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 2).toString(), text: 'Sorry, there was an error getting a response.', sender: 'ai' }
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <Header hidePlus={false} hideBranding={false} onSignInPress={startNewChat} />
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
              renderItem={({ item }) => (
                <View style={{ alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start', marginVertical: 8, maxWidth: '80%' }}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 180, height: 180, borderRadius: 16, marginBottom: 4 }} resizeMode="cover" />
                  ) : null}
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
                </View>
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
