# Implementation Plan: Recording UX Improvements & Hamburger Menu

## Overview
Two changes:
1. **Recording Flow** - Fix issues where save doesn't appear and make UX snappier
2. **Hamburger Menu** - Replace non-functional pause icon with menu showing profile/logout

---

## Change 1: Recording Flow Improvements

### Files to Modify
- `app/(tabs)/my-sounds/record.tsx`

### Issues to Fix
1. **Save button sometimes doesn't appear** - If `startRecording()` returns null, no error feedback
2. **Confusing UX** - Default name is long timestamp, no loading states

### Implementation

#### 1.1 Better Error Handling for Recording Start
```typescript
// In handleStartRecording, add error alert if recording fails
const newRecording = await startRecording();
if (!newRecording) {
  Alert.alert('Recording Failed', 'Could not start recording. Please check microphone permissions.');
  return;
}
```

#### 1.2 Simpler Default Name
Change from timestamp to simple auto-incrementing name:
```typescript
// Replace: `Recording ${new Date().toLocaleString()}`
// With: "Recording 1", "Recording 2", etc.
const existingRecordings = sounds.filter(s => s.name.startsWith('Recording ')).length;
setSoundName(`Recording ${existingRecordings + 1}`);
```

#### 1.3 Add Loading State to Save Button
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSaveRecording = async () => {
  setIsSaving(true);
  try {
    // existing save logic
  } finally {
    setIsSaving(false);
  }
};

// In JSX:
<Button
  title="Save Sound"
  onPress={handleSaveRecording}
  loading={isSaving}
  disabled={isSaving}
/>
```

#### 1.4 Reset State on "Record Again"
```typescript
// Before starting new recording, clear previous recording URI
setRecordingUri(null);
handleStartRecording();
```

---

## Change 2: Hamburger Menu (Replace Pause Button)

### Files to Modify
- `components/PauseButton.tsx` → Rename to `components/HeaderMenu.tsx`
- `app/(tabs)/_layout.tsx` - Update import

### Implementation

#### 2.1 Create HeaderMenu Component
Replace PauseButton with a hamburger menu that shows:
- **If authenticated**: User email + "Sign Out" option
- **If guest**: "Sign In" option

Use React Native Modal or a simple dropdown menu.

```typescript
// components/HeaderMenu.tsx
export function HeaderMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, isGuest, signOut } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    setMenuVisible(false);
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setMenuVisible(true)}>
        <Menu size={24} color={colors.lightText} />
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade">
        {/* Overlay + Menu dropdown positioned top-right */}
        {isGuest ? (
          <MenuItem icon={LogIn} title="Sign In" onPress={() => router.push('/(auth)/welcome')} />
        ) : (
          <>
            <Text>{user?.email}</Text>
            <MenuItem icon={LogOut} title="Sign Out" onPress={handleSignOut} />
          </>
        )}
      </Modal>
    </>
  );
}
```

#### 2.2 Update Tab Layout
```typescript
// app/(tabs)/_layout.tsx
import { HeaderMenu } from '@/components/HeaderMenu';

// Replace:
headerRight: () => <PauseButton />
// With:
headerRight: () => <HeaderMenu />
```

#### 2.3 Delete PauseButton
Remove `components/PauseButton.tsx` after migration.

---

## Summary of Changes

| File | Action |
|------|--------|
| `app/(tabs)/my-sounds/record.tsx` | Fix error handling, simpler names, loading state |
| `components/PauseButton.tsx` | Delete |
| `components/HeaderMenu.tsx` | Create (new hamburger menu) |
| `app/(tabs)/_layout.tsx` | Update import to use HeaderMenu |

## Testing Checklist
- [ ] Record a sound - verify save button appears after stopping
- [ ] Test recording failure (deny permission) - verify error message
- [ ] Check default name is simple ("Recording 1" not timestamp)
- [ ] Tap hamburger menu as guest - see "Sign In"
- [ ] Tap hamburger menu as authenticated - see email + "Sign Out"
- [ ] Sign out from menu - verify returns to home
