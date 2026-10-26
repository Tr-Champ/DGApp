import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';

interface FenceLineFrameProps {
    children: React.ReactNode;
    color?: string;
}

export default function FenceLineFrame({ children, color = '#2563EB' }: FenceLineFrameProps) {
    return (
        <View style={styles.container}>
            {/* Top Outer Fence Line */}
            <View style={[styles.topLine, { borderColor: color }]} />
            <View style={[styles.topSubLine, { borderColor: `${color}33` }]} />

            {/* Left Outer Fence Line */}
            <View style={[styles.leftLine, { borderColor: color }]} />
            <View style={[styles.leftSubLine, { borderColor: `${color}33` }]} />

            {/* Right Outer Fence Line */}
            <View style={[styles.rightLine, { borderColor: color }]} />
            <View style={[styles.rightSubLine, { borderColor: `${color}33` }]} />

            {/* Bottom Outer Fence Line */}
            <View style={[styles.bottomLine, { borderColor: color }]} />
            <View style={[styles.bottomSubLine, { borderColor: `${color}33` }]} />

            {/* Corner Tech Brackets */}
            <View style={[styles.cornerTopLeft, { borderColor: color }]} />
            <View style={[styles.cornerTopRight, { borderColor: color }]} />
            <View style={[styles.cornerBottomLeft, { borderColor: color }]} />
            <View style={[styles.cornerBottomRight, { borderColor: color }]} />

            {/* Perimeter Tick Marks (Simulating security fence / laser grid) */}
            <View style={[styles.tickTop, { backgroundColor: color }]} />
            <View style={[styles.tickBottom, { backgroundColor: color }]} />
            <View style={[styles.tickLeft, { backgroundColor: color }]} />
            <View style={[styles.tickRight, { backgroundColor: color }]} />

            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        zIndex: 10,
    },
    // Outer perimeter fence
    topLine: {
        position: 'absolute',
        top: 6,
        left: 8,
        right: 8,
        height: 0,
        borderTopWidth: 2,
        borderStyle: 'solid',
        zIndex: 5,
    },
    topSubLine: {
        position: 'absolute',
        top: 10,
        left: 14,
        right: 14,
        height: 0,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        zIndex: 5,
    },
    bottomLine: {
        position: 'absolute',
        bottom: 6,
        left: 8,
        right: 8,
        height: 0,
        borderBottomWidth: 2,
        borderStyle: 'solid',
        zIndex: 5,
    },
    bottomSubLine: {
        position: 'absolute',
        bottom: 10,
        left: 14,
        right: 14,
        height: 0,
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        zIndex: 5,
    },
    leftLine: {
        position: 'absolute',
        top: 8,
        bottom: 8,
        left: 6,
        width: 0,
        borderLeftWidth: 2,
        borderStyle: 'solid',
        zIndex: 5,
    },
    leftSubLine: {
        position: 'absolute',
        top: 14,
        bottom: 14,
        left: 10,
        width: 0,
        borderLeftWidth: 1,
        borderStyle: 'dashed',
        zIndex: 5,
    },
    rightLine: {
        position: 'absolute',
        top: 8,
        bottom: 8,
        right: 6,
        width: 0,
        borderRightWidth: 2,
        borderStyle: 'solid',
        zIndex: 5,
    },
    rightSubLine: {
        position: 'absolute',
        top: 14,
        bottom: 14,
        right: 10,
        width: 0,
        borderRightWidth: 1,
        borderStyle: 'dashed',
        zIndex: 5,
    },
    // Corner brackets
    cornerTopLeft: {
        position: 'absolute',
        top: 3,
        left: 3,
        width: 16,
        height: 16,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        zIndex: 6,
    },
    cornerTopRight: {
        position: 'absolute',
        top: 3,
        right: 3,
        width: 16,
        height: 16,
        borderTopWidth: 3,
        borderRightWidth: 3,
        zIndex: 6,
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 3,
        left: 3,
        width: 16,
        height: 16,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        zIndex: 6,
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        width: 16,
        height: 16,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        zIndex: 6,
    },
    // Center alignment ticks
    tickTop: {
        position: 'absolute',
        top: 4,
        left: '50%',
        marginLeft: -12,
        width: 24,
        height: 4,
        borderRadius: 2,
        zIndex: 6,
    },
    tickBottom: {
        position: 'absolute',
        bottom: 4,
        left: '50%',
        marginLeft: -12,
        width: 24,
        height: 4,
        borderRadius: 2,
        zIndex: 6,
    },
    tickLeft: {
        position: 'absolute',
        left: 4,
        top: '50%',
        marginTop: -12,
        width: 4,
        height: 24,
        borderRadius: 2,
        zIndex: 6,
    },
    tickRight: {
        position: 'absolute',
        right: 4,
        top: '50%',
        marginTop: -12,
        width: 4,
        height: 24,
        borderRadius: 2,
        zIndex: 6,
    },
});
