import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  elevation?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 1,
}) => {
  return (
    <PaperCard
      style={[styles.card, style]}
      elevation={elevation}
      onPress={onPress}
    >
      {children}
    </PaperCard>
  );
};

Card.Content = PaperCard.Content;
Card.Cover = PaperCard.Cover;
Card.Title = PaperCard.Title;
Card.Actions = PaperCard.Actions;

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
});

export default Card;
