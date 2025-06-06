import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon,
  error,
  style,
  multiline = false,
  numberOfLines = 1,
  showTogglePasswordButton = false
}) => {
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null,
        multiline ? styles.inputMultiline : null
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#4CAF50"
            style={styles.inputIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline ? styles.textMultiline : null
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={hidePassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
        />
        
        {showTogglePasswordButton && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={hidePassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#757575"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  inputMultiline: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    color: '#333',
    fontSize: 16,
  },
  textMultiline: {
    height: 'auto',
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  passwordToggle: {
    padding: 12,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;