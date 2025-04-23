import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  onPress, 
  style, 
  contentStyle,
  footer,
  footerStyle
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
      
      {footer && (
        <View style={[styles.footer, footerStyle]}>
          {footer}
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: subtitle ? 4 : 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
  },
  content: {
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

export default Card;