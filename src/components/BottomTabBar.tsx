import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Home,
  CalendarDays,
  BookOpen,
  MessageCircle,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { Colors, Typography, Radii, Layout } from '../constants/theme';

export interface CustomBottomTabBarProps {
  state: any;
  descriptors: any;
  navigation?: any;
  navigateToTab?: (routeKey: string) => void;
  emitter?: any;
  insets?: any;
}

interface TabItemConfig {
  name: string;
  labelKey: string;
  IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const TAB_CONFIGS: TabItemConfig[] = [
  { name: 'index', labelKey: 'tabs.home', IconComponent: Home },
  { name: 'track', labelKey: 'tabs.track', IconComponent: CalendarDays },
  { name: 'learn', labelKey: 'tabs.learn', IconComponent: BookOpen },
  { name: 'ask', labelKey: 'tabs.ask', IconComponent: MessageCircle },
  { name: 'settings', labelKey: 'tabs.settings', IconComponent: SettingsIcon },
];

export const BottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  navigateToTab,
  emitter,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          height: Layout.tabBarHeight + Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="tablist"
    >
      <View style={styles.tabBarInner}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const isFocused = state.index === index;
          const descriptor = descriptors[route.key] || {};
          const options = descriptor.options || {};

          const tabConfig = TAB_CONFIGS.find((cfg) => cfg.name === route.name) || {
            name: route.name,
            labelKey: `tabs.${route.name}`,
            IconComponent: Home,
          };

          const IconComponent = tabConfig.IconComponent;
          const label = String(t(tabConfig.labelKey, route.name));

          const onPress = () => {
            if (navigation?.emit) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event?.defaultPrevented) {
                navigation.navigate(route.name);
              }
            } else if (navigateToTab) {
              if (emitter?.emit) {
                emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
              }
              if (!isFocused) {
                navigateToTab(route.key);
              }
            }
          };

          const onLongPress = () => {
            if (navigation?.emit) {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            } else if (emitter?.emit) {
              emitter.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            }
          };

          const activeColor = Colors.tabBarActive;
          const inactiveColor = Colors.tabBarInactive;
          const currentColor = isFocused ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.activePillContainer,
                ]}
              >
                <IconComponent
                  size={20}
                  color={currentColor}
                  strokeWidth={isFocused ? 2.3 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: currentColor,
                    fontWeight: isFocused ? '600' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
    shadowColor: '#8C324E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  tabBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
    paddingVertical: 4,
  },
  iconContainer: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activePillContainer: {
    backgroundColor: Colors.tabBarActivePill,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Typography.family.medium,
    lineHeight: 14,
  },
});
