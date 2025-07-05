import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CalendarService } from '../services/CalendarService';
import { ContactsService } from '../services/ContactsService';
import { cn } from '../utils/cn';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: 'productivity' | 'communication' | 'system' | 'ai';
  available: boolean;
}

interface ToolCardProps {
  tool: Tool;
  onPress: (tool: Tool) => void;
  isLoading?: boolean;
}

const ToolCard = React.memo<ToolCardProps>(({ tool, onPress, isLoading = false }) => (
  <Pressable
    onPress={() => tool.available && onPress(tool)}
    disabled={!tool.available || isLoading}
    className={cn(
      'bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm',
      tool.available ? 'active:bg-gray-50' : 'opacity-50'
    )}
  >
    <View className="flex-row items-center">
      <View className={cn('w-12 h-12 rounded-2xl items-center justify-center mr-4', tool.color)}>
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name={tool.icon} size={24} color="white" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base">{tool.name}</Text>
        <Text className="text-gray-500 text-sm mt-1">{tool.description}</Text>
      </View>
      <View className="flex-row items-center">
        {!tool.available && (
          <Ionicons name="lock-closed" size={16} color="#9CA3AF" className="mr-2" />
        )}
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </View>
  </Pressable>
));

ToolCard.displayName = 'ToolCard';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: any) => void;
}

const CreateEventModal = React.memo<CreateEventModalProps>(({ visible, onClose, onCreateEvent }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    const eventData = {
      title: title.trim(),
      location: location.trim(),
      notes: notes.trim(),
      startDate: new Date(`${date}T${time}:00`),
      endDate: new Date(`${date}T${time}:00`),
    };

    onCreateEvent(eventData);
    setTitle('');
    setLocation('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={onClose}>
              <Text className="text-blue-500 font-semibold">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-gray-900">New Event</Text>
            <Pressable onPress={handleCreate}>
              <Text className="text-blue-500 font-semibold">Create</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Event title"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Time</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Event location"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                multiline
                numberOfLines={3}
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

CreateEventModal.displayName = 'CreateEventModal';

interface CreateContactModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateContact: (contactData: any) => void;
}

const CreateContactModal = React.memo<CreateContactModalProps>(({ visible, onClose, onCreateContact }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleCreate = () => {
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert('Error', 'Please enter at least a first or last name');
      return;
    }

    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumbers: phone.trim() ? [{ label: 'mobile', number: phone.trim() }] : [],
      emailAddresses: email.trim() ? [{ label: 'home', email: email.trim() }] : [],
    };

    onCreateContact(contactData);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={onClose}>
              <Text className="text-blue-500 font-semibold">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-gray-900">New Contact</Text>
            <Pressable onPress={handleCreate}>
              <Text className="text-blue-500 font-semibold">Create</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-gray-50 rounded-xl p-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

CreateContactModal.displayName = 'CreateContactModal';

export default function ToolsScreen() {
  const [loadingToolId, setLoadingToolId] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [recentResults, setRecentResults] = useState<string[]>([]);

  const tools: Tool[] = [
    {
      id: 'calendar-events',
      name: 'Calendar Events',
      description: 'View and manage calendar events',
      icon: 'calendar',
      color: 'bg-blue-500',
      category: 'productivity',
      available: true,
    },
    {
      id: 'create-event',
      name: 'Create Event',
      description: 'Add new event to calendar',
      icon: 'add-circle',
      color: 'bg-green-500',
      category: 'productivity',
      available: true,
    },
    {
      id: 'contacts-search',
      name: 'Search Contacts',
      description: 'Find contacts by name or info',
      icon: 'search',
      color: 'bg-purple-500',
      category: 'communication',
      available: true,
    },
    {
      id: 'create-contact',
      name: 'Create Contact',
      description: 'Add new contact to address book',
      icon: 'person-add',
      color: 'bg-orange-500',
      category: 'communication',
      available: true,
    },
    {
      id: 'file-manager',
      name: 'File Manager',
      description: 'Browse and manage files',
      icon: 'folder',
      color: 'bg-yellow-500',
      category: 'system',
      available: true,
    },
    {
      id: 'system-info',
      name: 'System Info',
      description: 'Device and app information',
      icon: 'information-circle',
      color: 'bg-gray-500',
      category: 'system',
      available: true,
    },
    {
      id: 'ai-tools',
      name: 'AI Tools',
      description: 'AI-powered productivity tools',
      icon: 'bulb',
      color: 'bg-pink-500',
      category: 'ai',
      available: false, // Not yet implemented
    },
    {
      id: 'web-search',
      name: 'Web Search',
      description: 'Search the web for information',
      icon: 'globe',
      color: 'bg-cyan-500',
      category: 'ai',
      available: false, // Not yet implemented
    },
  ];

  useEffect(() => {
    console.log('ToolsScreen mounted');
    return () => {
      console.log('ToolsScreen unmounted');
    };
  }, []);

  const addResult = (result: string) => {
    setRecentResults(prev => [result, ...prev.slice(0, 4)]);
  };

  const handleToolPress = async (tool: Tool) => {
    setLoadingToolId(tool.id);

    try {
      switch (tool.id) {
        case 'calendar-events':
          await handleCalendarEvents();
          break;
        case 'create-event':
          setShowEventModal(true);
          break;
        case 'contacts-search':
          await handleContactsSearch();
          break;
        case 'create-contact':
          setShowContactModal(true);
          break;
        case 'file-manager':
          await handleFileManager();
          break;
        case 'system-info':
          await handleSystemInfo();
          break;
        default:
          Alert.alert('Coming Soon', `${tool.name} will be available in a future update.`);
      }
    } catch (error) {
      console.error(`Tool ${tool.id} failed:`, error);
      Alert.alert('Error', `Failed to execute ${tool.name}. Please try again.`);
    } finally {
      setLoadingToolId(null);
    }
  };

  const handleCalendarEvents = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Next 7 days

      const events = await CalendarService.getEvents(startDate, endDate);
      
      if (events.length === 0) {
        addResult('No upcoming events found in the next 7 days');
        Alert.alert('Calendar Events', 'No upcoming events found in the next 7 days.');
      } else {
        const eventSummary = `Found ${events.length} upcoming events`;
        addResult(eventSummary);
        
        const eventList = events.slice(0, 5).map(event => 
          `• ${event.title} (${event.startDate.toLocaleDateString()})`
        ).join('\n');
        
        Alert.alert('Upcoming Events', eventList);
      }
    } catch (error) {
      console.error('Calendar events failed:', error);
      addResult('❌ Failed to fetch calendar events');
      Alert.alert('Error', 'Failed to access calendar. Please check permissions.');
    }
  };

  const handleContactsSearch = async () => {
    try {
      Alert.prompt(
        'Search Contacts',
        'Enter a name to search for:',
        async (searchText) => {
          if (!searchText?.trim()) return;
          
          setLoadingToolId('contacts-search');
          
          try {
            const contacts = await ContactsService.searchContacts(searchText.trim());
            
            if (contacts.length === 0) {
              addResult(`No contacts found for "${searchText}"`);
              Alert.alert('Search Results', `No contacts found for "${searchText}".`);
            } else {
              const resultText = `Found ${contacts.length} contact(s) for "${searchText}"`;
              addResult(resultText);
              
              const contactList = contacts.slice(0, 5).map(contact => 
                `• ${contact.firstName} ${contact.lastName}`
              ).join('\n');
              
              Alert.alert('Search Results', contactList);
            }
          } catch (error) {
            console.error('Contact search failed:', error);
            addResult('❌ Contact search failed');
            Alert.alert('Error', 'Failed to search contacts. Please check permissions.');
          } finally {
            setLoadingToolId(null);
          }
        }
      );
    } catch (error) {
      console.error('Contact search setup failed:', error);
    }
  };

  const handleFileManager = async () => {
    // Mock file manager functionality
    const mockFiles = [
      'Documents/report.pdf',
      'Downloads/image.jpg',
      'Photos/vacation.png',
      'Music/song.mp3',
      'Videos/demo.mp4',
    ];

    addResult(`Found ${mockFiles.length} recent files`);
    Alert.alert('File Manager', `Recent files:\n\n${mockFiles.join('\n')}`);
  };

  const handleSystemInfo = async () => {
    // Mock system info
    const systemInfo = [
      `Device: iPhone Simulator`,
      `OS: iOS 17.0`,
      `App Version: 1.0.0`,
      `Storage: 256 GB`,
      `Free Space: 128 GB`,
    ];

    addResult('Retrieved system information');
    Alert.alert('System Information', systemInfo.join('\n'));
  };

  const handleCreateEvent = async (eventData: any) => {
    setShowEventModal(false);
    setLoadingToolId('create-event');

    try {
      const success = await CalendarService.createEvent(eventData);
      
      if (success) {
        addResult(`✅ Created event: ${eventData.title}`);
        Alert.alert('Success', `Event "${eventData.title}" created successfully!`);
      } else {
        addResult(`❌ Failed to create event: ${eventData.title}`);
        Alert.alert('Error', 'Failed to create event. Please try again.');
      }
    } catch (error) {
      console.error('Create event failed:', error);
      addResult(`❌ Event creation failed`);
      Alert.alert('Error', 'Failed to create event. Please check permissions.');
    } finally {
      setLoadingToolId(null);
    }
  };

  const handleCreateContact = async (contactData: any) => {
    setShowContactModal(false);
    setLoadingToolId('create-contact');

    try {
      const success = await ContactsService.createContact(contactData);
      
      if (success) {
        const name = `${contactData.firstName} ${contactData.lastName}`.trim();
        addResult(`✅ Created contact: ${name}`);
        Alert.alert('Success', `Contact "${name}" created successfully!`);
      } else {
        addResult(`❌ Failed to create contact`);
        Alert.alert('Error', 'Failed to create contact. Please try again.');
      }
    } catch (error) {
      console.error('Create contact failed:', error);
      addResult(`❌ Contact creation failed`);
      Alert.alert('Error', 'Failed to create contact. Please check permissions.');
    } finally {
      setLoadingToolId(null);
    }
  };

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const categoryNames = {
    productivity: 'Productivity',
    communication: 'Communication',
    system: 'System',
    ai: 'AI Tools',
  };

  const categoryIcons = {
    productivity: 'briefcase' as keyof typeof Ionicons.glyphMap,
    communication: 'people' as keyof typeof Ionicons.glyphMap,
    system: 'settings' as keyof typeof Ionicons.glyphMap,
    ai: 'bulb' as keyof typeof Ionicons.glyphMap,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-purple-500 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons name="construct" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">Tools</Text>
            <Text className="text-gray-500 text-center mt-1">
              Native device integrations and utilities
            </Text>
          </View>

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
              <Text className="text-lg font-bold text-gray-900 mb-3">Recent Results</Text>
              {recentResults.map((result, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                  <Text className="text-gray-700 text-sm flex-1">{result}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tool Categories */}
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <View key={category} className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-3">
                  <Ionicons 
                    name={categoryIcons[category as keyof typeof categoryIcons]} 
                    size={16} 
                    color="#6B7280" 
                  />
                </View>
                <Text className="text-lg font-bold text-gray-900">
                  {categoryNames[category as keyof typeof categoryNames]}
                </Text>
                <Text className="text-gray-500 text-sm ml-2">
                  ({categoryTools.filter(t => t.available).length}/{categoryTools.length})
                </Text>
              </View>

              {categoryTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onPress={handleToolPress}
                  isLoading={loadingToolId === tool.id}
                />
              ))}
            </View>
          ))}

          {/* Info */}
          <View className="bg-blue-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-blue-900 font-bold ml-2">About Tools</Text>
            </View>
            <Text className="text-blue-800 text-sm leading-relaxed">
              Tools provide direct access to native device capabilities. All operations 
              respect your privacy and require appropriate permissions. Some tools may 
              require additional setup or system access.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <CreateEventModal
        visible={showEventModal}
        onClose={() => setShowEventModal(false)}
        onCreateEvent={handleCreateEvent}
      />

      <CreateContactModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        onCreateContact={handleCreateContact}
      />
    </SafeAreaView>
  );
}