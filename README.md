# CourtQuest

A pickleball community app for iOS and Android. Find games near you, claim your court as King or Queen, challenge other players, and control your VersaPro pitching machine — all in one place.

Built with React Native + Expo.

---

## Features

### Find a Game
- Browse open games near you on a map or list
- Filter by skill level, date/time, indoor/outdoor
- Create a game and invite players
- In-game group chat
- Push notifications

### King of the Court
- Claim a court when you arrive (GPS-verified)
- Other players at the same court can issue a challenge
- Log match results — opponent must sign off to confirm
- Leaderboard: court → city → national
- Lose the crown if someone beats you

### Avatars & Progression
- Custom avatar builder
- Unlock gear and badges with wins
- Win streaks, home court, rank badges

### VersaPro Machine Control *(coming soon)*
- Connect to your VersaPro pitching machine via Bluetooth/Wi-Fi
- Adjust speed, spin, and feed rate from your phone
- Save and load custom drill programs

---

## Tech Stack

| Layer | Tool |
|---|---|
| App | React Native + Expo |
| Backend | Firebase (Auth, Firestore, Cloud Messaging) |
| Maps | Google Maps SDK |
| Subscriptions | RevenueCat |
| State | Zustand |

---

## Subscription Tiers

| Tier | Price | Features |
|---|---|---|
| Free | $0 | Browse courts, view games, basic profile |
| Pro | $4.99/mo | Create/join games, King of the Court, full stats, avatar upgrades |
| Club | $9.99/mo | Everything in Pro + crew management, priority court submission, exclusive badges |

---

## Project Structure

```
src/
├── screens/
│   ├── Map/          # Court map, King of the Court
│   ├── Games/        # Find & create games
│   ├── Leaderboard/  # Court, city, national rankings
│   ├── Profile/      # Avatar, stats, badges
│   ├── Machine/      # VersaPro machine control
│   └── Auth/         # Login, signup
├── components/       # Shared UI components
├── navigation/       # Tab and stack navigators
├── hooks/            # Custom React hooks
├── services/         # Firebase, RevenueCat, Maps
├── store/            # Zustand state management
├── constants/        # Colors, fonts, config
└── assets/           # Images, icons, avatars
```

---

## Court System

Courts are pre-loaded from OpenStreetMap and Google Places. Users can submit unlisted courts for review — approved submissions earn a badge.

---

## King of the Court Flow

```
1. Player arrives at court (GPS check — must be within 100m)
2. Player claims the court
3. Another player at the court issues a challenge
4. Match is played
5. Winner logs the result
6. Loser receives a push notification to confirm
7. On confirmation → crown transfers, rank points awarded
```

---

## Status

🚧 In development — targeting App Store & Google Play launch.

---

Built by the VersaPro team. [versaprosports.com](https://versaprosports.com)
