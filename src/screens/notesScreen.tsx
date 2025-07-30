import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Modal, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

const NOTES_KEY = 'studypal_notes';
const UNDO_TIMEOUT = 3500;

const NotesScreen: React.FC = () => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState<Array<{id: string, title: string, content: string, created: number, modified: number}>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<null | {id: string, title: string, content: string, created: number, modified: number}>(null);
  const [undoNote, setUndoNote] = useState<null | {id: string, title: string, content: string, created: number, modified: number}>(null);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTES_KEY);
        if (stored) setNotes(JSON.parse(stored));
      } catch {}
      setLoading(false);
    };
    loadNotes();
    return () => { if (undoTimer.current) clearTimeout(undoTimer.current); };
  }, []);

  const saveNotes = async (newNotes: typeof notes) => {
    setNotes(newNotes);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
  };

  const openEditor = (note?: typeof editingNote) => {
    setEditingNote(note || { id: '', title: '', content: '', created: Date.now(), modified: Date.now() });
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setEditingNote(null);
  };

  const saveNote = async (note: typeof editingNote) => {
    let updated: typeof notes;
    if (!note) return;
    if (!note.title.trim() && !note.content.trim()) return;
    if (note.id && notes.some(n => n.id === note.id)) {
      // Update existing
      updated = notes.map(n => n.id === note.id ? { ...note, modified: Date.now() } : n);
    } else {
      // New note
      const newNote = { ...note, id: Date.now().toString(), created: Date.now(), modified: Date.now() };
      updated = [newNote, ...notes];
    }
    await saveNotes(updated);
    closeEditor();
  };

  const deleteNote = async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;
    setUndoNote(noteToDelete);
    const updated = notes.filter(n => n.id !== id);
    await saveNotes(updated);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoNote(null), UNDO_TIMEOUT);
  };

  const undoDelete = async () => {
    if (!undoNote) return;
    const updated = [undoNote, ...notes];
    await saveNotes(updated);
    setUndoNote(null);
  };

  // Filter and sort notes
  const filteredNotes = notes
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.modified - a.modified);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <Header hidePlus={true} />
      <View style={styles.centeredContentWrapper}>
        {/* Search bar */}
        <View style={styles.searchBarWrapper}>
          <TextInput
            style={[styles.searchBar, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Search notes..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* Notes list */}
        <FlatList
          data={filteredNotes}
          keyExtractor={item => item.id}
          ListEmptyComponent={loading ? (
            <Text style={{ color: theme.textSecondary, fontSize: 16, textAlign: 'center', marginTop: 32 }}>Loading...</Text>
          ) : (
            <Text style={{ color: theme.textSecondary, fontSize: 16, textAlign: 'center', marginTop: 32 }}>No notes yet.</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => openEditor(item)}>
              <View style={styles.noteHeader}>
                <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <TouchableOpacity onPress={() => deleteNote(item.id)}>
                  <Text style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: 13 }}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.notePreview, { color: theme.textSecondary }]} numberOfLines={1}>{item.content.split('\n')[0]}</Text>
              <Text style={styles.noteDate}>{new Date(item.modified).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
          style={{ width: '100%', flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
        {/* Floating Add Button */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.accent }]} onPress={() => openEditor()}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
        {/* Undo Snackbar */}
        {undoNote && (
          <Animated.View style={[styles.snackbar, { backgroundColor: theme.card }]}> 
            <Text style={{ color: theme.text, fontWeight: 'bold' }}>Note deleted</Text>
            <TouchableOpacity onPress={undoDelete}><Text style={{ color: theme.accent, fontWeight: 'bold', marginLeft: 12 }}>UNDO</Text></TouchableOpacity>
          </Animated.View>
        )}
        {/* Note Editor Modal */}
        <Modal visible={editorVisible} animationType="slide" onRequestClose={closeEditor}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
            <Header hidePlus={true} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.editorWrapper}>
                <TextInput
                  style={[styles.editorTitle, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                  placeholder="Title"
                  placeholderTextColor={theme.textSecondary}
                  value={editingNote?.title || ''}
                  onChangeText={t => setEditingNote(editingNote ? { ...editingNote, title: t, modified: Date.now() } : null)}
                />
                <TextInput
                  style={[styles.editorContent, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                  placeholder="Write your note..."
                  placeholderTextColor={theme.textSecondary}
                  value={editingNote?.content || ''}
                  onChangeText={c => setEditingNote(editingNote ? { ...editingNote, content: c, modified: Date.now() } : null)}
                  multiline
                  numberOfLines={10}
                />
                <Text style={styles.editorDate}>
                  {editingNote ? `Created: ${new Date(editingNote.created).toLocaleString()}\nModified: ${new Date(editingNote.modified).toLocaleString()}` : ''}
                </Text>
                <View style={styles.editorActions}>
                  <TouchableOpacity style={[styles.editorBtn, { backgroundColor: theme.accent }]} onPress={() => saveNote(editingNote)}>
                    <Text style={styles.editorBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editorBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]} onPress={closeEditor}>
                    <Text style={[styles.editorBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#141417' },
  centeredContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  centeredScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 32,
  },
  titleSection: { alignItems: 'center', marginTop: 0, marginBottom: 16, paddingHorizontal: 12 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 14, color: '#fff', textAlign: 'center' },
  mainDesc: { color: '#b0b0b0', fontSize: 15, textAlign: 'center' },
  searchBarWrapper: {
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 0,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  notesContent: {
    marginTop: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
    minHeight: 120,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  notePreview: {
    fontSize: 15,
    marginBottom: 6,
  },
  noteDate: {
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },
  snackbar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 90,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  editorWrapper: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-start',
  },
  editorTitle: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  editorContent: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  editorDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editorBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginLeft: 8,
  },
  editorBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default NotesScreen;
