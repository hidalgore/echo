# ECHO Safe Header Standard v1

All ECHO screens with custom headers must respect the device safe area.

## Rules

1. Never position a header title, back button, menu button, share button, or notification button at `top: 0` without adding `insets.top`.
2. Screens using `useSafeAreaInsets()` should calculate:
   - `safeHeaderHeight = insets.top + 64`
   - header top padding: `insets.top + 8` minimum
   - horizontal padding: 20–24 minimum
3. Back buttons must not sit on the physical screen edge.
   - Minimum horizontal safe padding: 20
   - Preferred: 22–24
4. Header title should be centered inside the usable header row, not the full screen/status area.
5. Any absolute header must offset scroll content by the full safe header height.
6. Touch targets must remain at least 44×44.
7. Mobile modals/sheets must use safe-area bottom padding and Android `onRequestClose`.

## Canonical pattern

```tsx
const insets = useSafeAreaInsets();
const safeHeaderHeight = insets.top + 64;

<ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: safeHeaderHeight }]}>
  <View style={[styles.headerShell, { height: safeHeaderHeight, paddingTop: insets.top + 8 }]}>
    ...
  </View>
</ScrollView>
```

## Header style

```tsx
headerShell: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  minHeight: 64,
  paddingHorizontal: 24,
  paddingBottom: 8,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
}
```
