# Magick Journal Plugin for Obsidian

This plugin adds a number of tools for practitioners of Magick to Obsidian to aid in journaling.

## Commands

It's recommended to add hotkeys for these commands if you plan on using them often.

* **full-heading**: Inserts the full heading as configured in the options for the plugin

Example Output:

	☉︎ in 15° Virgo ♍ : ☽︎ in 29° Gemini ♊
	
	**Anno Ⅴ.ⅰⅹ A.N.**
	dies Iovis ♃
	7-9-2023 e.v.
	
	**Time:** 10:56 PM MDT
	**Moon:** Waning Crescent 38%
	**Location:** Home, Colorado Springs CO
	**Current Weather:** Clear Sky, 61.4°F, 29.83in

* **insert-astro**: Inserts the astrological header with the Sun and Moon positions.

* **insert-time**: Inserts the current time and timezone

* **insert-extra-fields**: Inserts the extra fields as configured in the options for the plugin.

* **insert-date-ev**: Inserts the current EV date.

* **insert-date-an**: Inserts the current New Aeon date.

* **insert-day**: Inserts the latin day of the week.

* **insert-weather**: Inserts current local weather conditions, temperature and air pressure.

* **insert-moon**: Inserts current phase of the moon and illumination percentage.

## Settings

### Default Entries

**Default Location**: The default location to use to populate the "Default Location" field in the full header output. This does not affect weather lookups, which are always performed based on your location.

### Header 

**Header Fields**: Comma separated fields to populate full header with. Options are:

* **Astro**: To insert the current astrological header from EraLegis
* **Anno**: To insert the current New Aeon date
* **Day**: To insert the current latin day of the week
* **EV**: To insert the current common era date 
* **Time**: To insert the current local time and timezone
* **Moon**: To insert the current phase of the moon and illumination percentage
* **Location**: To insert the configured Default Location
* **Weather**: To insert the current local weather
* **Blank**: To insert a blank line.

**Unrecognized options will be inserted as additional fields.**

Example Configuration:

	Astro, Anno, Day, EV, Blank, Time, Moon, Location, Weather, Other

### Astro

**Emojis in Astro Field**: Whether to use emojis in the astrological header.

**English Names in Astro Field**: Whether to use English sign names in the astrological header.

### Weather

**Temperature Decimal Places**: Number of decimal places to display for temperature.

**Temperature Units**: Units to display temperature in, Celsius or Fahrenheit.

**Air Pressure Units**: Units to display air pressure in, inches or millibars.


## About

magick-journal pulls the current astrological correspondence and Thelemic date from https://eralegis.info/ and the current weather from https://open-meteo.com/.

Both services are provided free of charge, but if you find this plugin useful, please consider donating to them (especially EraLegis ❤️).

## Todo

- [ ] Add more fine-tuned settings for all fields.
- [ ] Adjust date popup to be configurable.
