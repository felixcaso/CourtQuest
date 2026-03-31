import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/Map/MapScreen';
import GamesScreen from '../screens/Games/GamesScreen';
import LeaderboardScreen from '../screens/Leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import MachineScreen from '../screens/Machine/MachineScreen';
import { COLORS } from '../constants/colors';
import { FONT_SIZES } from '../constants/fonts';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.navy,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Map: 'map',
            Games: 'calendar',
            Leaderboard: 'trophy',
            Profile: 'person',
            Machine: 'settings',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Machine" component={MachineScreen} />
    </Tab.Navigator>
  );
}
