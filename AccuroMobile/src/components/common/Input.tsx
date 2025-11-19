import React, { useState } from 'react';
import { TextInput } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: any;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  left,
  right,
  style,
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecure = () => setIsSecure(!isSecure);

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={isSecure}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      error={error}
      disabled={disabled}
      multiline={multiline}
      numberOfLines={numberOfLines}
      mode="outlined"
      style={[styles.input, style]}
      left={left}
      right={
        secureTextEntry ? (
          <TextInput.Icon
            icon={isSecure ? 'eye' : 'eye-off'}
            onPress={toggleSecure}
          />
        ) : (
          right
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
});

export default Input;
