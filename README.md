# Magick Journal Plugin for Obsidian

This plugin adds a number of tools for practitioners of Magick to Obsidian to aid in journaling.

## Commands

It's recommended to add hotkeys for these commands if you plan on using them often.

**full-heading**: Inserts the full heading as configured in the options for the plugin

Example Output:

	☉︎ in 15° Virgo ♍ : ☽︎ in 29° Gemini ♊
	
	**Anno Ⅴ.ⅰⅹ A.N.**
	dies Iovis ♃
	7-9-2023 e.v.
	
	**Time:** 10:56 PM MDT
	**Moon:** Waning Crescent 38%
	**Location:** Home, Colorado Springs CO
	**Current Weather:** Clear Sky, 61.4°F, 29.83in

**insert-astro**: Inserts the astrological header with the Sun and Moon positions.

**insert-time**: Inserts the current time and timezone

**insert-extra-fields**: Inserts the extra fields as configured in the options for the plugin.

**insert-date-ev**: Inserts the current EV date.

**insert-date-an**: Inserts the current New Aeon date.

**insert-day**: Inserts the latin day of the week.

**insert-weather**: Inserts current local weather conditions, temperature and air pressure.

**insert-moon**: Inserts current phase of the moon and illumination percentage.

## Settings

**Default Location**: The default location to use to populate the "Default Location" field in the full header output. This does not affect weather lookups, which are always performed based on your location.

**Additional Default Fields**: Additional fields to include in the full header output separated by commas. This defaults to "Other", but you can add any fields you want here.


## Todo

- [ ] Add setting to configure default fields
