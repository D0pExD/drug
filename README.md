# Drug Lab System

A FiveM resource that adds a fully interactive drug lab experience with minigames, consequences, and police alerts. This script is intended for DEMO PURPUSES ONLY and should not be used directly in your production server without proper testing!

## Features

- Interactive cooking minigame with temperature and pressure controls
- Realistic lab interior with interactive objects
- Consequences for failure (explosions, toxic leaks)
- Police alert system
- Reward system for successful cooking

## Installation

1. Copy the `drug` folder to your server's `resources` directory
2. Add `ensure drug` to your server.cfg
3. Restart your server or start the resource

## Configuration

All settings can be found in `config.lua`:

- Lab location coordinates
- Minigame settings (difficulty, safe zones)
- Cooldown timers
- Reward items and amounts
- Police alert thresholds

## Usage

Players can:
1. Find the lab entrance at the configured location
2. Enter the lab
3. Interact with lab equipment to start the cooking process
4. Balance temperature and pressure in the minigame
5. Receive rewards for successful cooking

## Dependencies

- ox_target - Required for interaction with objects


## Made on

- UI based on Next.js & Tailwind

## License

This resource is licensed under MIT License. See LICENSE file for details.

## IMPORTANT NOTICE
This script is for DEMO PURPOSES only! Please do not use this directly in your production server without thorough testing and modifications. The author is not responsable for any issues that may arise from improper use of this resource. Thank you! 