import { ExhibitInfo } from '../types/game';

// ============================================================================
// 1. CENTRAL MONUMENT, NASA INVENTIONS, TECHNOLOGIES & BREAKTHROUGHS (12 + 2)
// ============================================================================

export const NASA_BREAKTHROUGH_EXHIBITS: Record<string, ExhibitInfo> = {
  ex_monument_central: {
    id: 'ex_monument_central',
    category: 'monument',
    title: 'Central Space Exploration Monument',
    subtitle: 'Saturn V, Space Launch System & EVA Pioneers',
    year: '1958 – PRESENT',
    fact: 'Celebrating decades of engineering breakthroughs that carried explorers from Earth orbit to the Moon, Mars, and interstellar space.',
    background:
      'Founded by the National Aeronautics and Space Act of 1958, NASA united U.S. aeronautical laboratories and rocket pioneers to build civilian spaceflight capabilities from the ground up.',
    whatHappened:
      'Multi-stage heavy-lift launch vehicles such as the Saturn V enabled crews to escape Earth gravity and reach the Moon, while robotic deep-space missions mapped every planet in the Solar System.',
    peopleInvolved:
      'Hundreds of thousands of NASA engineers, flight controllers, contractor teams, scientists, and astronauts across Kennedy, Johnson, Marshall, Ames, Langley, Goddard, and JPL.',
    significance:
      'Demonstrated staged cryogenic propulsion, precision orbital mechanics, and long-duration human life support.',
    whyItChanged:
      'Transformed space from science fiction into an active realm of scientific research, global communications, planetary defense, and human exploration.',
    interestingFacts: [
      'Standing 110.6 metres tall, the Apollo Saturn V remains one of the largest and most powerful rockets ever flown.',
      'Modern Artemis missions build on multi-stage heavy-lift heritage with the Space Launch System and Orion spacecraft.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/KSC-20190606-PH_JBS01_0063/KSC-20190606-PH_JBS01_0063~thumb.jpg',
    imageCaption: 'Artemis I Space Launch System hardware at Kennedy Space Center.',
    attribution: 'NASA / Public Domain',
    visualKind: 'monument_rocket',
    accentColor: '#fbbf24',
  },

  ex_agc: {
    id: 'ex_agc',
    category: 'breakthrough',
    title: 'Apollo Guidance Computer',
    subtitle: 'NASA & MIT Instrumentation Laboratory · Embedded Computing',
    year: '1960s',
    fact: 'Compact onboard computing helped astronauts navigate and control Apollo spacecraft during lunar missions.',
    background:
      'Before Apollo, computers typically filled entire air-conditioned rooms. To fly to the Moon, Apollo needed a lightweight, shock-resistant computer that fit inside a spacecraft cabin and consumed less power than a household light bulb.',
    whatHappened:
      'Designed under NASA contract by the MIT Instrumentation Laboratory, the Apollo Guidance Computer (AGC) ran real-time guidance, navigation, and engine control software for both the Command Module and Lunar Module, operated via the famous DSKY (Display and Keyboard) interface.',
    peopleInvolved:
      'Charles Stark Draper, Margaret Hamilton (who led the onboard flight software team), Eldon Hall, and the MIT Instrumentation Laboratory engineering team.',
    significance:
      'It was one of the first computers built with silicon integrated circuits (microchips) and featured priority-scheduled real-time multitasking software and woven copper "rope core" read-only memory.',
    whyItChanged:
      'Proved that miniaturized digital computers and fault-tolerant software could safely fly complex aerospace vehicles, accelerating the modern microelectronics and software engineering industries.',
    interestingFacts: [
      'During the Apollo 11 lunar descent, priority scheduling allowed the AGC to shed low-priority radar tasks while keeping critical landing guidance running smoothly.',
      'Its clock speed was 2.048 MHz with roughly 72 KB of read-only rope memory and 4 KB of erasable RAM.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/EC73-3478/EC73-3478~thumb.jpg',
    imageCaption: 'NASA Dryden Flight Research Center testing Apollo-era digital fly-by-wire technology using an Apollo Guidance Computer.',
    attribution: 'NASA / Public Domain',
    visualKind: 'agc_dsky',
    accentColor: '#22c55e',
  },

  ex_apollo11: {
    id: 'ex_apollo11',
    category: 'breakthrough',
    title: 'Apollo 11 Moon Landing',
    subtitle: 'United States · NASA · Sea of Tranquility',
    year: '1969',
    fact: "Humanity's first crewed landing on the Moon. Neil Armstrong and Buzz Aldrin walked on the lunar surface.",
    background:
      'Following the Mercury and Gemini programmes, Apollo 11 set out to fulfil the goal of landing astronauts on the Moon and returning them safely to Earth before the end of the 1960s.',
    whatHappened:
      'Launched atop a Saturn V on July 16, 1969, Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin descended to the Sea of Tranquility aboard Lunar Module Eagle on July 20, while Command Module Pilot Michael Collins orbited above in Columbia. Armstrong stepped onto the Moon at 02:56 UTC on July 21.',
    peopleInvolved:
      'Neil Armstrong, Buzz Aldrin, Michael Collins, Flight Director Gene Kranz, Launch & Mission Control teams, and over 400,000 engineers, technicians, and scientists.',
    significance:
      'Achieved the first crewed landing on another celestial body, deployed lunar laser retroreflectors and seismometers, and returned 21.55 kg of lunar rocks for laboratory study.',
    whyItChanged:
      'Proved humans could navigate, land on, explore, and return safely from another world—ushering in planetary science based on direct extraterrestrial samples.',
    interestingFacts: [
      'Eagle touched down with less than 30 seconds of hover fuel remaining after Neil Armstrong steered past a boulder-strewn crater.',
      'Lunar laser ranging reflectors placed during Apollo 11 still bounce Earth-based laser pulses back to astronomers today.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/as11-40-5874/as11-40-5874~thumb.jpg',
    imageCaption: 'Buzz Aldrin stands beside the deployed flag and Lunar Module Eagle on July 20, 1969 (photographed by Neil Armstrong).',
    attribution: 'NASA / Public Domain',
    visualKind: 'apollo_eagle',
    accentColor: '#fbbf24',
  },

  ex_hubble: {
    id: 'ex_hubble',
    category: 'breakthrough',
    title: 'Hubble Space Telescope',
    subtitle: 'NASA & European Space Agency (ESA)',
    year: '1990',
    fact: 'A space telescope that transformed our understanding of galaxies, stars, black holes and the expanding universe.',
    background:
      'Earth’s atmosphere blurs starlight and absorbs ultraviolet wavelengths. Astronomers spent decades designing an orbital observatory able to look far beyond atmospheric distortion.',
    whatHappened:
      'Deployed into low Earth orbit by Space Shuttle Discovery (STS-31) in April 1990, Hubble initially suffered from a spherical aberration in its 2.4-metre primary mirror. Space Shuttle astronauts repaired its optics during Servicing Mission 1 (STS-61) in 1993 and upgraded its instruments across four more servicing missions through 2009.',
    peopleInvolved:
      'Nancy Grace Roman ("Mother of Hubble"), Lyman Spitzer, NASA Goddard & STScI teams, ESA partners, and Space Shuttle servicing crews.',
    significance:
      'Observed distant galaxies in the Hubble Deep Field, refined the age of the universe (~13.8 billion years), and confirmed supermassive black holes at galactic centres.',
    whyItChanged:
      'Demonstrated the unmatched scientific power of orbiting optical telescopes and proved complex spacecraft can be upgraded in space by astronauts.',
    interestingFacts: [
      'Hubble orbits Earth at roughly 27,300 km/h, completing one full orbit every ~95 minutes.',
      'Its five Space Shuttle servicing missions extended Hubble’s productive lifetime for more than three decades.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/sts061-57-021/sts061-57-021~thumb.jpg',
    imageCaption: 'Hubble Space Telescope photographed from Space Shuttle Endeavour during the 1993 STS-61 servicing mission.',
    attribution: 'NASA / Public Domain',
    visualKind: 'hubble_scope',
    accentColor: '#38bdf8',
  },

  ex_iss: {
    id: 'ex_iss',
    category: 'breakthrough',
    title: 'International Space Station',
    subtitle: 'NASA, Roscosmos, ESA, JAXA & CSA Multinational Partnership',
    year: '1998 onwards',
    fact: 'A multinational research laboratory in orbit where astronauts conduct experiments in microgravity.',
    background:
      'Building on experience from Skylab, Salyut, Mir, and Shuttle-Mir, five space agencies united to construct a permanent modular research station in low Earth orbit.',
    whatHappened:
      'Assembly began in November 1998 with the launch of the Zarya functional cargo block and Unity node. Dozens of Space Shuttle and Russian rocket flights added laboratories, truss solar arrays, and robotic arms. Crews have lived and worked continuously aboard the station since Expedition 1 arrived in November 2000.',
    peopleInvolved:
      'Partner space agencies NASA (USA), Roscosmos (Russia), ESA (Europe), JAXA (Japan), and CSA (Canada), alongside hundreds of international expedition crews.',
    significance:
      'Supports research in human physiology, fluid physics, combustion, protein crystal growth, Earth observation, and spacecraft life-support recycling.',
    whyItChanged:
      'Established continuous human presence in space and proved complex international cooperation can build and maintain infrastructure in orbit.',
    interestingFacts: [
      'Stretching ~109 metres end-to-end, the ISS spans roughly the length of an American football field.',
      'Crew members witness 16 sunrises and sunsets every 24 hours while orbiting at ~400 km altitude.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/s134e007114/s134e007114~thumb.jpg',
    imageCaption: 'ISS Expedition 27 and Space Shuttle STS-134 crew members meet aboard the orbiting laboratory.',
    attribution: 'NASA / Public Domain',
    visualKind: 'iss_station',
    accentColor: '#60a5fa',
  },

  ex_gps: {
    id: 'ex_gps',
    category: 'breakthrough',
    title: 'GPS and Satellite Navigation',
    subtitle: 'U.S. Dept. of Defense System · NASA Space Geodesy & Timing Contributions',
    year: '1970s – PRESENT',
    fact: 'Satellite navigation transformed how people determine location and navigate around Earth.',
    background:
      'Following early radio-navigation satellites such as Transit (1960s), the U.S. Department of Defense (Air Force, later Space Force) developed and operates the Navstar Global Positioning System (GPS), launched starting in 1978.',
    whatHappened:
      'GPS uses a constellation of satellites broadcasting precise atomic-clock timing signals so receivers can calculate three-dimensional position and velocity. NASA did NOT invent the GPS system on its own, but contributed vital supporting space science: precision orbital tracking, space geodesy, relativistic clock corrections, and the Global Differential GPS (GDGPS) system built at NASA JPL for centimetre-level scientific positioning.',
    peopleInvolved:
      'U.S. Department of Defense pioneers including Bradford Parkinson, Gladys West, Roger Easton, alongside NASA Jet Propulsion Laboratory and Goddard geodesy and spacecraft-navigation engineers.',
    significance:
      'Satellite timing and geodesy require extreme orbital precision and general/special relativity corrections—fields where NASA space-navigation research plays an essential scientific role.',
    whyItChanged:
      'Global positioning now underpins aviation, maritime shipping, agriculture, earthquake monitoring, disaster response, and everyday smartphones—and NASA also extends autonomous navigation beyond Earth orbit.',
    interestingFacts: [
      'Without accounting for Einstein’s relativity (satellite clocks run slightly faster in weaker gravity and slower due to orbital speed), GPS errors would drift by ~11 km per day.',
      'NASA’s JPL-developed GDGPS helps track spacecraft launches, tectonic plate motion, and atmospheric moisture to centimetre accuracy.',
    ],
    imageCaption: 'Multi-orbital navigation constellation diagram highlighting U.S. DoD GPS satellites and NASA space-geodesy augmentation.',
    attribution: 'Historical Technical Diagram (DoD GPS + NASA GDGPS)',
    visualKind: 'gps_constellation',
    accentColor: '#22d3ee',
  },

  ex_landsat: {
    id: 'ex_landsat',
    category: 'breakthrough',
    title: 'Landsat Earth Observation',
    subtitle: 'NASA & U.S. Geological Survey (USGS) · Since 1972',
    year: '1972',
    fact: "Decades of satellite observations help scientists understand Earth's changing land, forests, oceans and environment.",
    background:
      'Astronaut photography during Mercury, Gemini, and Apollo proved how revealing orbital views of Earth could be. NASA and the Department of the Interior partnered to create a dedicated civilian Earth-monitoring satellite series.',
    whatHappened:
      'Launched on July 23, 1972 as Earth Resources Technology Satellite 1 (later renamed Landsat 1), the programme pioneered digital multispectral imaging from space. Subsequent Landsat satellites (continuing through Landsat 8 and Landsat 9) have captured an unbroken global archive spanning over 50 years.',
    peopleInvolved:
      'Virginia Norwood ("Mother of Landsat", who designed the Multispectral Scanner), NASA Goddard teams, and the U.S. Geological Survey (USGS).',
    significance:
      'Created the longest continuous space-based record of Earth’s land surfaces, using visible and infrared bands to measure vegetation health, water quality, urban growth, and glaciers.',
    whyItChanged:
      'In 2008, USGS and NASA made the entire Landsat data archive free and open to the world, revolutionizing climate research, forestry, drought monitoring, and sustainable land management.',
    interestingFacts: [
      'Landsat 1 carried Virginia Norwood’s Multispectral Scanner, proving digital satellite imagery worked far better than film cameras.',
      'Every spot on Earth is re-imaged regularly, enabling time-lapse studies of deforestation, river deltas, and retreating ice.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA02988/PIA02988~thumb.jpg',
    imageCaption: 'Early Landsat Multispectral Scanner view of Southern California, showcasing space-based land-use mapping.',
    attribution: 'NASA / USGS / Public Domain',
    visualKind: 'landsat_earth',
    accentColor: '#34d399',
  },

  ex_voyager1: {
    id: 'ex_voyager1',
    category: 'breakthrough',
    title: 'Voyager 1',
    subtitle: 'NASA Jet Propulsion Laboratory · Interstellar Mission',
    year: '1977',
    fact: "One of humanity's most distant spacecraft, exploring beyond the planets and into interstellar space.",
    background:
      'In the late 1970s, a rare orbital alignment occurring once every ~176 years allowed spacecraft to use gravity assists to tour the outer giant planets.',
    whatHappened:
      'Launched on September 5, 1977, Voyager 1 performed historic flybys of Jupiter (1979) and Saturn (1980), discovering active volcanoes on Io and studying Saturn’s rings and moon Titan. Continuing outward, Voyager 1 crossed the heliopause in August 2012, becoming the first human-made object to enter interstellar space.',
    peopleInvolved:
      'NASA Jet Propulsion Laboratory (JPL) Voyager flight and science teams led by Project Manager John Casani, Project Scientist Ed Stone, and Carl Sagan (who chaired the Golden Record committee).',
    significance:
      'Transformed our view of the outer Solar System from blurry telescope dots into dynamic worlds, and now directly measures plasma and cosmic rays between the stars.',
    whyItChanged:
      'Demonstrated multi-decade deep-space engineering using radioisotope thermoelectric generators (RTGs) and gravity-assist trajectories, inspiring generations via the Pale Blue Dot portrait and the Golden Record.',
    interestingFacts: [
      'Voyager 1 carries a gold-plated copper phonograph record containing Earth sounds, music, and greetings in 55 languages.',
      'Radio signals from Voyager 1 take over 22 hours travelling at the speed of light to reach Earth.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA04495/PIA04495~thumb.jpg',
    imageCaption: 'NASA JPL illustration of a Voyager spacecraft travelling through the outer heliosphere toward interstellar space.',
    attribution: 'NASA / JPL / Public Domain',
    visualKind: 'voyager_probe',
    accentColor: '#f59e0b',
  },

  ex_mer_rovers: {
    id: 'ex_mer_rovers',
    category: 'breakthrough',
    title: 'Mars Exploration Rovers',
    subtitle: 'NASA JPL · Spirit & Opportunity',
    year: '2000s',
    fact: 'Robotic explorers investigated Martian rocks, terrain and evidence of ancient water.',
    background:
      'After Pathfinder’s small Sojourner rover demonstrated wheeled mobility on Mars in 1997, NASA designed twin solar-powered robot geologists capable of traversing kilometres across craters and plains.',
    whatHappened:
      'Launched in 2003, Spirit (Gusev Crater) and Opportunity (Meridiani Planum) landed via airbags in January 2004 for planned 90-sol missions. Both dramatically outlasted expectations: Spirit operated until 2010 and Opportunity operated until 2018, driving 45.16 km across Mars.',
    peopleInvolved:
      'Principal Investigator Steve Squyres, NASA Jet Propulsion Laboratory rover engineering and science operations teams.',
    significance:
      'Discovered hematite concretions ("blueberries"), sulfate-rich sedimentary rocks, and clay minerals proving liquid water once flowed and pooled on ancient Mars.',
    whyItChanged:
      'Turned robotic rovers into long-lived mobile field geologists and established key landing, driving, and solar/dust-survival techniques for future Mars missions.',
    interestingFacts: [
      'Designed for 90 Martian days, Opportunity survived nearly 15 Earth years—more than 55 times its planned mission length.',
      'Passing Martian dust devils periodically swept Opportunity’s solar panels clean, extending its mission through multiple winters.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA20285/PIA20285~thumb.jpg',
    imageCaption: 'NASA Mars Exploration Rover Opportunity inspecting bedrock targets on the Martian surface.',
    attribution: 'NASA / JPL-Caltech / Cornell / Public Domain',
    visualKind: 'mer_rover',
    accentColor: '#fb923c',
  },

  ex_curiosity: {
    id: 'ex_curiosity',
    category: 'breakthrough',
    title: 'Curiosity Rover',
    subtitle: 'NASA JPL · Mars Science Laboratory · Gale Crater',
    year: '2012',
    fact: 'A mobile science laboratory investigating whether ancient Mars had conditions suitable for microbial life.',
    background:
      'Earlier rovers found strong evidence of past water on Mars. NASA designed the car-sized, nuclear-powered Curiosity rover to test whether ancient Martian environments could actually have supported living microbes.',
    whatHappened:
      'Landed inside Gale Crater in August 2012 using the pioneering rocket-powered "Sky Crane" descent manoeuvre, Curiosity carries an onboard chemistry suite (SAM and CheMin), a rock-vaporising laser (ChemCam), and a drill as it climbs Mount Sharp.',
    peopleInvolved:
      'John Grotzinger, Ashwin Vasavada, Sky Crane architect Adam Steltzner, and the NASA JPL Mars Science Laboratory team with international instrument partners (France, Spain, Russia, Germany, Canada).',
    significance:
      'Confirmed within its first year that Yellowknife Bay was once an ancient freshwater lakebed with water, chemical energy sources, and key organic elements needed for habitability.',
    whyItChanged:
      'Proved the Sky Crane precision-landing architecture for heavy spacecraft and shifted Mars science from "follow the water" to investigating ancient habitability.',
    interestingFacts: [
      'Curiosity is powered by a Multi-Mission Radioisotope Thermoelectric Generator (MMRTG) using plutonium-238 heat, allowing it to work day and night through Martian dust storms.',
      'It has climbed hundreds of vertical metres up Mount Sharp, reading billion-year-old rock layers like chapters in a book.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~thumb.jpg',
    imageCaption: 'Self-portrait of NASA’s Curiosity rover at the "Buckskin" rock drill site in Gale Crater, Mars.',
    attribution: 'NASA / JPL-Caltech / MSSS / Public Domain',
    visualKind: 'curiosity_rover',
    accentColor: '#f97316',
  },

  ex_perseverance: {
    id: 'ex_perseverance',
    category: 'breakthrough',
    title: 'Perseverance Rover and Ingenuity',
    subtitle: 'NASA JPL · Jezero Crater · Mars 2020',
    year: '2021',
    fact: 'Perseverance explores Mars and collects samples. Ingenuity demonstrated powered, controlled flight on another planet.',
    background:
      'Building on Curiosity’s chassis, Mars 2020 targeted Jezero Crater—an ancient river delta—to search for signs of past microscopic life, cache rock cores for potential future return to Earth, and test new exploration technologies.',
    whatHappened:
      'Landing on February 18, 2021 via Terrain-Relative Navigation, Perseverance also carried the MOXIE experiment (which produced breathable oxygen from Martian CO2) and deployed the solar-powered Ingenuity helicopter. On April 19, 2021, Ingenuity achieved the first powered, controlled aerodynamic flight on another planet, completing 72 flights before retiring in 2024.',
    peopleInvolved:
      'MiMi Aung (Ingenuity Project Manager), Ken Farley, Matt Wallace, and the NASA JPL & international Mars 2020 teams.',
    significance:
      'Demonstrated in-situ oxygen generation on Mars (MOXIE), sealed scientifically selected core samples, and proved rotorcraft can scout ahead across thin Martian air (~1% of Earth’s sea-level pressure).',
    whyItChanged:
      'Opened aerial exploration of other worlds and validated oxygen production technology vital for future human crews on Mars.',
    interestingFacts: [
      'Ingenuity carried a postage-stamp-sized swatch of muslin fabric from the 1903 Wright Flyer as a tribute to the Wright brothers.',
      'MOXIE successfully generated over 120 grams of oxygen directly from Mars’s carbon-dioxide atmosphere.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA25970/PIA25970~thumb.jpg',
    imageCaption: 'Perseverance captures the Ingenuity Mars Helicopter hovering during its 54th flight in Jezero Crater.',
    attribution: 'NASA / JPL-Caltech / Public Domain',
    visualKind: 'perseverance_ingenuity',
    accentColor: '#38bdf8',
  },

  ex_jwst: {
    id: 'ex_jwst',
    category: 'breakthrough',
    title: 'James Webb Space Telescope',
    subtitle: 'NASA, European Space Agency (ESA) & Canadian Space Agency (CSA)',
    year: '2021',
    fact: 'A powerful space observatory studying the early universe, distant galaxies, stars and exoplanet atmospheres.',
    background:
      'Because cosmic expansion stretches ultraviolet and visible light from the earliest galaxies into infrared wavelengths, astronomers needed a cryogenic infrared observatory far larger and colder than Hubble.',
    whatHappened:
      'Launched on an Ariane 5 rocket from French Guiana on December 25, 2021, JWST unfolded its 6.5-metre 18-segment gold-coated beryllium mirror and tennis-court-sized five-layer sunshield en route to the Sun–Earth L2 point 1.5 million kilometres from Earth.',
    peopleInvolved:
      'John Mather, Gregory Robinson, thousands of engineers and scientists across NASA, ESA, and CSA.',
    significance:
      'Captures infrared light from galaxies formed just a few hundred million years after the Big Bang, peers inside star-forming dust nurseries, and analyses molecules like water and CO2 in exoplanet atmospheres.',
    whyItChanged:
      'Pushed observational astronomy back toward Cosmic Dawn and set a new standard for origami-style robotic spacecraft deployment in deep space.',
    interestingFacts: [
      'The sunshield keeps the telescope’s infrared instruments below -220 °C while the sun-facing side reaches over 85 °C.',
      'All 18 hexagonal mirror segments adjust by nanometres so they act as a single giant optical surface.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000422/GSFC_20171208_Archive_e000422~thumb.jpg',
    imageCaption: 'James Webb Space Telescope’s 18 gold-coated hexagonal primary mirror segments during assembly at NASA Goddard.',
    attribution: 'NASA / Chris Gunn / Public Domain',
    visualKind: 'jwst_mirror',
    accentColor: '#eab308',
  },

  ex_shuttle: {
    id: 'ex_shuttle',
    category: 'breakthrough',
    title: 'Space Shuttle Programme',
    subtitle: 'NASA Space Transportation System (1981 – 2011)',
    year: '1981',
    fact: 'A reusable orbital spacecraft system that transformed human spaceflight and satellite servicing.',
    background:
      'After the expendable Saturn capsules of Apollo, NASA pursued a partially reusable winged spacecraft capable of launching like a rocket, carrying large payloads and crews, and gliding back to land on a runway.',
    whatHappened:
      'Beginning with STS-1 (Columbia) on April 12, 1981, five orbiters—Columbia, Challenger, Discovery, Atlantis, and Endeavour—flew 135 missions over 30 years. Shuttles launched and repaired Hubble, deployed interplanetary probes, conducted Spacelab science, and hauled most of the International Space Station into orbit. The programme also suffered two tragic accidents, Challenger (1986) and Columbia (2003), claiming 14 astronauts.',
    peopleInvolved:
      'John Young, Robert Crippen (STS-1 crew), Sally Ride, Eileen Collins, flight directors, engineers, and 355 astronauts from 16 nations.',
    significance:
      'Demonstrated reusable thermal protection tiles, runway landings from orbit, heavy payload delivery, and in-orbit satellite capture and repair.',
    whyItChanged:
      'Made building the International Space Station and servicing Hubble possible, while teaching crucial lessons about spacecraft safety culture and heat-shield risk.',
    interestingFacts: [
      'A Space Shuttle orbiter returned to Earth as an unpowered glider, landing at speeds near 340 km/h.',
      'Over 25,000 silica ceramic heat-shield tiles protected each orbiter from ~1,650 °C atmospheric reentry temperatures.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/8111969/8111969~thumb.jpg',
    imageCaption: 'Space Shuttle Columbia lifts off on STS-1 in April 1981, marking the first orbital flight of a winged reusable spacecraft.',
    attribution: 'NASA / Public Domain',
    visualKind: 'space_shuttle',
    accentColor: '#94a3b8',
  },

  ex_future_artemis: {
    id: 'ex_future_artemis',
    category: 'breakthrough',
    title: 'Artemis & Future Deep-Space Exploration',
    subtitle: 'NASA & International Partners · Moon to Mars',
    year: '2020s – FUTURE',
    fact: 'Returning humans to the Moon to establish sustainable lunar operations and prepare for crewed Mars expeditions.',
    background:
      'Building on Apollo heritage, robotic Mars reconnaissance, and 25+ years of ISS experience, international space agencies are developing deep-space habitats, reusable landers, and nuclear/solar propulsion.',
    whatHappened:
      'Artemis I completed an uncrewed Orion flight around the Moon in 2022, paving the way for crewed lunar flybys, surface landings near the water-ice-rich lunar South Pole, the Lunar Gateway orbital outpost, and closed-loop life support for eventual human missions to Mars.',
    peopleInvolved:
      'NASA, ESA, JAXA, CSA, commercial launch and lander partners, and the Artemis astronaut corps.',
    significance:
      'Focuses on long-term sustainability—testing ice mining, surface power, dust mitigation, and radiation shielding before attempting multi-year Mars voyages.',
    whyItChanged:
      'Shifts human spaceflight from brief exploration sorties toward permanent deep-space outposts.',
    interestingFacts: [
      'Deep-space crews bound for Mars will travel hundreds of times farther from Earth than the International Space Station.',
      'Lessons learned in this very simulation—closed-loop water, oxygen, hydroponics, and ISRU fuel—mirror real Artemis-to-Mars engineering.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/KSC-20190606-PH_JBS01_0063/KSC-20190606-PH_JBS01_0063~thumb.jpg',
    imageCaption: 'Artemis deep-space hardware paving the way for sustained lunar exploration and eventual Mars expeditions.',
    attribution: 'NASA / Public Domain',
    visualKind: 'future_artemis',
    accentColor: '#a78bfa',
  },
};

// ============================================================================
// 2. FAMOUS ASTRONAUTS — LEGENDS OF SPACE EXPLORATION (12)
// ============================================================================

export const FAMOUS_ASTRONAUT_EXHIBITS: ExhibitInfo[] = [
  {
    id: 'astro_armstrong',
    category: 'astronaut',
    title: 'Neil Armstrong',
    subtitle: 'United States · Apollo 11 · 1969',
    year: '1930 – 2012',
    fact: 'First human to walk on the Moon. Commander of Apollo 11.',
    background:
      'A naval aviator, X-15 rocket-plane research test pilot, and NASA astronaut selected in Group 2 (1962), Armstrong commanded Gemini 8 before leading Apollo 11.',
    whatHappened:
      'On July 20, 1969, Armstrong manually piloted Lunar Module Eagle over a boulder-filled crater to touch down safely on the Sea of Tranquility, then became the first person to set foot on the Moon.',
    peopleInvolved:
      'Flew alongside Buzz Aldrin and Michael Collins on Apollo 11; previously flew Gemini 8 with David Scott.',
    significance:
      'Demonstrated exceptional cool-headed piloting during both the Gemini 8 thruster emergency and Apollo 11’s historic lunar touchdown.',
    whyItChanged:
      'His first steps on lunar soil marked a defining milestone in human history and planetary exploration.',
    interestingFacts: [
      'Before becoming an astronaut, Armstrong flew 78 combat missions and piloted the hypersonic X-15 up to Mach 5.74.',
      'Following his NASA career, he taught aerospace engineering at the University of Cincinnati.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/9018112/9018112~thumb.jpg',
    imageCaption: 'Apollo 11 Commander Neil A. Armstrong in his A7L lunar pressure suit.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_apollo',
    accentColor: '#fbbf24',
  },
  {
    id: 'astro_aldrin',
    category: 'astronaut',
    title: 'Buzz Aldrin',
    subtitle: 'United States · Apollo 11 · 1969',
    year: 'Born 1930',
    fact: 'Second human to walk on the Moon. Helped conduct the first lunar surface exploration.',
    background:
      'Holding an MIT doctorate in astronautics, Edwin "Buzz" Aldrin pioneered practical orbital rendezvous techniques during Gemini 12 in 1966.',
    whatHappened:
      'As Lunar Module Pilot of Apollo 11, Aldrin helped guide Eagle to the lunar surface and stepped onto the Moon 19 minutes after Armstrong, deploying scientific experiments and collecting surface samples.',
    peopleInvolved:
      'Apollo 11 crewmates Neil Armstrong and Michael Collins; Gemini 12 partner Jim Lovell.',
    significance:
      'Solved critical orbital rendezvous mechanics later used on Apollo, Space Shuttle, and ISS docking missions, and tested EVA mobility on the Moon.',
    whyItChanged:
      'Turned orbital rendezvous from theoretical math into routine flight procedure and helped carry out humanity’s first lunar fieldwork.',
    interestingFacts: [
      'His MIT doctoral thesis was titled "Line-of-Sight Guidance Techniques for Manned Orbital Rendezvous".',
      'During Gemini 12, he proved underwater training could prepare astronauts for demanding spacewalks.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~thumb.jpg',
    imageCaption: 'Buzz Aldrin on the Moon during Apollo 11 EVA; Neil Armstrong and the Eagle lander reflect in his gold visor.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_apollo',
    accentColor: '#f59e0b',
  },
  {
    id: 'astro_gagarin',
    category: 'astronaut',
    title: 'Yuri Gagarin',
    subtitle: 'Soviet Union · Vostok 1 · 1961',
    year: '1934 – 1968',
    fact: 'First human to travel into outer space and orbit Earth.',
    background:
      'Selected from Soviet Air Force fighter pilots for the Soviet space programme (OKB-1) led by Chief Designer Sergei Korolev, Gagarin excelled in high-G and isolation tests.',
    whatHappened:
      'On April 12, 1961, aboard Vostok 1 launched from Baikonur Cosmodrome, Gagarin completed one orbit around Earth in 108 minutes and parachuted safely back to the ground.',
    peopleInvolved:
      'Soviet Chief Designer Sergei Korolev, cosmonaut trainer Nikolai Kamanin, and the Vostok 1 engineering team (Soviet Space Programme).',
    significance:
      'Proved the human body could survive launch acceleration, microgravity, and orbital reentry—opening the era of human spaceflight worldwide.',
    whyItChanged:
      'Every subsequent crewed mission—American, Soviet/Russian, European, Asian, and international—followed the trail broken on April 12, 1961.',
    interestingFacts: [
      'Vostok 1 was largely controlled from the ground and by automated systems because doctors did not yet know how weightlessness affected pilot coordination.',
      'International Day of Human Space Flight (April 12) commemorates his historic orbit.',
    ],
    imageCaption: 'Commemorative portrait tribute to Soviet cosmonaut Yuri Gagarin, Vostok 1 (April 12, 1961 — Soviet Space Programme).',
    attribution: 'Historical Portrait Illustration (Soviet Space Programme)',
    visualKind: 'astronaut_vostok',
    accentColor: '#ef4444',
  },
  {
    id: 'astro_ride',
    category: 'astronaut',
    title: 'Sally Ride',
    subtitle: 'United States · STS-7 · 1983',
    year: '1951 – 2012',
    fact: 'First American woman in space. Also worked as a physicist and science educator.',
    background:
      'Earning a Ph.D. in astrophysics from Stanford University, Dr. Sally Ride joined NASA Astronaut Group 8 in 1978—the first class to include women and Space Shuttle mission specialists.',
    whatHappened:
      'Flying aboard Space Shuttle Challenger on STS-7 in June 1983 (and again on STS-41G in 1984), Ride operated the Shuttle’s Canadian-built robotic arm to deploy and retrieve satellites in orbit.',
    peopleInvolved:
      'NASA Astronaut Group 8; STS-7 crew led by Commander Robert Crippen; later served on both the Rogers Commission (Challenger) and Columbia Accident Investigation Board.',
    significance:
      'Expanded opportunities for women in U.S. human spaceflight and later championed EarthKAM and STEM science education for students worldwide.',
    whyItChanged:
      'Showed generations of students—especially young women—that astrophysics and astronaut flight careers belonged to everyone.',
    interestingFacts: [
      'She was the only person to serve on both the Challenger and Columbia Space Shuttle accident investigation panels.',
      'As a teen, Sally Ride was also a nationally ranked junior tennis player before choosing physics.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/s07-31-1603/s07-31-1603~thumb.jpg',
    imageCaption: 'NASA astronaut Sally Ride monitoring mission systems on the Space Shuttle Challenger flight deck during STS-7 (1983).',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_shuttle',
    accentColor: '#38bdf8',
  },
  {
    id: 'astro_chawla',
    category: 'astronaut',
    title: 'Kalpana Chawla',
    subtitle: 'India-born American astronaut · STS-87 and STS-107',
    year: '1962 – 2003',
    fact: 'First woman of Indian origin in space. A NASA astronaut whose career inspired generations.',
    background:
      'Born in Karnal, India, Kalpana Chawla studied aeronautical engineering at Punjab Engineering College before earning a Master’s and Ph.D. in aerospace engineering in the United States and conducting computational fluid dynamics research at NASA Ames.',
    whatHappened:
      'Selected as a NASA astronaut in 1994, she first flew to space on Space Shuttle Columbia (STS-87, 1997) as mission specialist and primary robotic arm operator. She flew again on STS-107 (2003), completing 80 microgravity science experiments before tragically perishing with six crewmates during reentry.',
    peopleInvolved:
      'STS-87 and STS-107 Columbia crews, including Rick Husband, Laurel Clark, David Brown, Willie McCool, Michael Anderson, and Ilan Ramon.',
    significance:
      'Contributed aerodynamics and Space Shuttle robotic operations expertise while becoming an enduring international symbol of scientific determination.',
    whyItChanged:
      'Inspired millions of young engineers and scientists across India, the United States, and the world to pursue aerospace careers.',
    interestingFacts: [
      'Both a NASA supercomputer and a Northrup Grumman Cygnus cargo spacecraft were named in her honour.',
      'An asteroid (51826 Kalpanachawla) and a hill on Mars bear her name.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/01pp1639/01pp1639~thumb.jpg',
    imageCaption: 'Official portrait of NASA astronaut and aerospace engineer Dr. Kalpana Chawla.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_shuttle',
    accentColor: '#fb923c',
  },
  {
    id: 'astro_williams',
    category: 'astronaut',
    title: 'Sunita Williams',
    subtitle: 'United States · International Space Station missions',
    year: 'Born 1965',
    fact: 'NASA astronaut known for long-duration spaceflight, spacewalks and leadership aboard the ISS.',
    background:
      'A U.S. Navy helicopter test pilot and flight instructor, Sunita "Suni" Williams was selected as a NASA astronaut in 1998.',
    whatHappened:
      'She served as flight engineer, Expedition 33 Commander of the International Space Station, and later piloted and commanded Boeing Starliner’s Crew Flight Test alongside long-duration Expedition 71/72 ISS operations, performing numerous spacewalks to repair power and cooling systems.',
    peopleInvolved:
      'International Space Station Expedition 14/15, 32/33, and 71/72 international crewmates from NASA, Roscosmos, ESA, and JAXA.',
    significance:
      'Accumulated over 60 hours of extravehicular activity (EVA) and extensive experience testing both ISS habitats and modern commercial crew spacecraft.',
    whyItChanged:
      'Demonstrated long-duration human adaptability, complex station maintenance, and transition from Space Shuttle to next-generation crew vehicles.',
    interestingFacts: [
      'During Expedition 14/15 in 2007, she ran the Boston Marathon on an ISS treadmill while orbiting ~400 km above Earth.',
      'She also completed the first orbital triathlon in 2012 using a station exercise bike, treadmill, and resistive strength machine.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/jsc2005e02663/jsc2005e02663~thumb.jpg',
    imageCaption: 'Official NASA portrait of astronaut and ISS Expedition Commander Sunita L. Williams.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_iss',
    accentColor: '#06b6d4',
  },
  {
    id: 'astro_glenn',
    category: 'astronaut',
    title: 'John Glenn',
    subtitle: 'United States · Friendship 7 · 1962',
    year: '1921 – 2016',
    fact: 'First American to orbit Earth. Later returned to space aboard the Space Shuttle.',
    background:
      'A decorated Marine Corps fighter pilot and supersonic test pilot who set a transcontinental speed record in 1957, John Glenn was selected among NASA’s original Mercury Seven astronauts in 1959.',
    whatHappened:
      'On February 20, 1962, aboard Mercury-Atlas 6 spacecraft Friendship 7, Glenn orbited Earth three times in 4 hours and 55 minutes, manually flying attitude control when an automatic thruster clogged and safely surviving reentry despite a suspected heat-shield indicator alert.',
    peopleInvolved:
      'The Mercury Seven; NASA mathematician Katherine Johnson (whose orbital calculations Glenn specifically asked to verify by hand before launch); STS-95 Discovery crew.',
    significance:
      'Proved an American astronaut could pilot and survive orbital flight, restoring national confidence in Project Mercury; 36 years later, at age 77, he flew on Space Shuttle Discovery (STS-95, 1998) for geriatric space-medical studies.',
    whyItChanged:
      'Became a cornerstone of early U.S. human spaceflight and later contributed unique data comparing young and senior astronauts in microgravity.',
    interestingFacts: [
      'Before liftoff, Glenn famously requested that NASA mathematician Katherine Johnson double-check the computer’s Friendship 7 reentry trajectory numbers.',
      'At age 77 on STS-95 in 1998, he became the oldest person ever to fly in Earth orbit.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/S62-05540/S62-05540~thumb.jpg',
    imageCaption: 'Official NASA Mercury Project portrait of astronaut John H. Glenn Jr.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_mercury',
    accentColor: '#60a5fa',
  },
  {
    id: 'astro_tereshkova',
    category: 'astronaut',
    title: 'Valentina Tereshkova',
    subtitle: 'Soviet Union · Vostok 6 · 1963',
    year: 'Born 1937',
    fact: 'First woman in space.',
    background:
      'Originally a textile factory worker and accomplished amateur skydiver with over 120 jumps, Valentina Tereshkova was recruited into the Soviet Union’s first female cosmonaut group in 1962.',
    whatHappened:
      'On June 16, 1963, she launched solo aboard Vostok 6 (call sign "Chaika" / Seagull), completing 48 orbits around Earth over nearly three days—logging more flight time than all American astronauts combined up to that date.',
    peopleInvolved:
      'Soviet Space Programme (OKB-1 / Sergei Korolev); flew simultaneously in space with Valery Bykovsky aboard Vostok 5.',
    significance:
      'Provided the first biomedical data on how female astronauts tolerate launch, multi-day microgravity, and reentry.',
    whyItChanged:
      'Broke the gender barrier in human spaceflight just two years after Yuri Gagarin’s first flight.',
    interestingFacts: [
      'She remains the only woman in history to have flown a completely solo spaceflight.',
      'Before launch, she noticed an orientation software error in Vostok 6’s descent programming and reported it so ground engineers could upload a fix.',
    ],
    imageCaption: 'Historical portrait tribute to Soviet cosmonaut Valentina Tereshkova, Vostok 6 (June 16, 1963 — Soviet Space Programme).',
    attribution: 'Historical Portrait Illustration (Soviet Space Programme)',
    visualKind: 'astronaut_vostok',
    accentColor: '#f472b6',
  },
  {
    id: 'astro_hadfield',
    category: 'astronaut',
    title: 'Chris Hadfield',
    subtitle: 'Canada · International Space Station',
    year: 'Born 1959',
    fact: 'Canadian astronaut and former ISS commander known for communicating science and life in space.',
    background:
      'A Royal Canadian Air Force fighter pilot and test pilot, Chris Hadfield joined the Canadian Space Agency (CSA) in 1992 and flew twice on the Space Shuttle (STS-74 to Mir and STS-100 to install Canadarm2 on the ISS).',
    whatHappened:
      'Launched on Soyuz TMA-07M in December 2012, Hadfield served on Expedition 34 and became the first Canadian Commander of the International Space Station during Expedition 35 in 2013.',
    peopleInvolved:
      'Canadian Space Agency (CSA), NASA, Roscosmos, ESA, and Expedition 34/35 ISS crews.',
    significance:
      'Helped install and operate Canada’s Canadarm2 robotics and used global social media and science demonstrations to show hundreds of millions of people how daily life works in microgravity.',
    whyItChanged:
      'Redefined public science outreach from orbit, bringing space research into classrooms and living rooms around the world.',
    interestingFacts: [
      'On STS-100 (2001), he became the first Canadian to perform a spacewalk, helping attach the robotic Canadarm2.',
      'His zero-gravity acoustic guitar recording aboard the ISS showcased life aboard the orbital outpost.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/s97-00690/s97-00690~thumb.jpg',
    imageCaption: 'Portrait of Canadian Space Agency astronaut Chris Hadfield, future Commander of ISS Expedition 35.',
    attribution: 'NASA / CSA / Public Domain',
    visualKind: 'astronaut_iss',
    accentColor: '#ef4444',
  },
  {
    id: 'astro_whitson',
    category: 'astronaut',
    title: 'Peggy Whitson',
    subtitle: 'United States · NASA astronaut',
    year: 'Born 1960',
    fact: 'NASA astronaut and former Chief Astronaut, recognised for extensive experience in spaceflight and space station research.',
    background:
      'With a Ph.D. in biochemistry from Rice University, Dr. Peggy Whitson worked as a NASA research biochemist and Shuttle-Mir project scientist before selection as a NASA astronaut in 1996.',
    whatHappened:
      'She served as ISS Expedition 5 science officer, became the first female Commander of the International Space Station (Expedition 16, 2007), served as NASA’s first female Chief of the Astronaut Office, commanded Expedition 51, and accumulated 675+ cumulative days in space across NASA and later commercial Axiom flights.',
    peopleInvolved:
      'NASA Astronaut Office, ISS Expedition 5, 16, 50/51 crews, and space-station biochemistry researchers.',
    significance:
      'Logged more cumulative time in space (675+ days) than any other American astronaut and completed 10 spacewalks totalling over 60 hours.',
    whyItChanged:
      'Demonstrated how career space-station researchers can lead orbital science, maintenance, and international expedition command.',
    interestingFacts: [
      'She grew soybeans aboard the ISS during Expedition 5 to advance orbital crop research.',
      'She broke the record for oldest woman in space and cumulative days in orbit by an American.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/KSC-02pd0637/KSC-02pd0637~thumb.jpg',
    imageCaption: 'NASA biochemist and former Chief Astronaut Dr. Peggy Whitson prior to Expedition 5 launch.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_iss',
    accentColor: '#a855f7',
  },
  {
    id: 'astro_jemison',
    category: 'astronaut',
    title: 'Mae Jemison',
    subtitle: 'United States · STS-47 · 1992',
    year: 'Born 1956',
    fact: 'First African-American woman in space. A physician, engineer and astronaut.',
    background:
      'Graduating in chemical engineering from Stanford University and earning her medical degree from Cornell University, Dr. Mae Jemison served as a Peace Corps medical officer in West Africa before joining NASA Astronaut Group 12 in 1987.',
    whatHappened:
      'In September 1992, Jemison served as Science Mission Specialist aboard Space Shuttle Endeavour on STS-47—a cooperative NASA/Japan Spacelab-J mission—conducting bone-cell, weightlessness, and motion-sickness experiments.',
    peopleInvolved:
      'STS-47 Endeavour crew (including Commander Robert Gibson and Japanese astronaut Mamoru Mohri) and Spacelab-J life-science researchers.',
    significance:
      'Advanced microgravity biomedical research and became the first Black woman to travel into space.',
    whyItChanged:
      'Opened doors for underrepresented scientists, physicians, and engineers in human spaceflight and inspired global STEM initiatives.',
    interestingFacts: [
      'She carried a photo of pioneering aviator Bessie Coleman and an Alpha Kappa Alpha flag into orbit.',
      'Since leaving NASA, she has led the 100 Year Starship initiative and championed science literacy worldwide.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/S92-40463/S92-40463~thumb.jpg',
    imageCaption: 'Official NASA portrait of physician, engineer, and STS-47 astronaut Dr. Mae C. Jemison.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_shuttle',
    accentColor: '#10b981',
  },
  {
    id: 'astro_collins',
    category: 'astronaut',
    title: 'Eileen Collins',
    subtitle: 'United States · Space Shuttle programme',
    year: 'Born 1956',
    fact: 'First woman to pilot and later command a Space Shuttle mission.',
    background:
      'A U.S. Air Force test pilot and flight instructor, Colonel Eileen Collins joined NASA in 1990.',
    whatHappened:
      'She piloted Space Shuttle Discovery on STS-63 (1995, the first Shuttle rendezvous with Russian station Mir) and Atlantis on STS-84 (1997), then commanded Columbia on STS-93 (1999, deploying the Chandra X-ray Observatory) and Discovery on STS-114 (2005 Return to Flight).',
    peopleInvolved:
      'STS-63, STS-84, STS-93 (Chandra deployment), and STS-114 Shuttle crews.',
    significance:
      'Commanded major orbital observatory deployments and led NASA’s rigorous STS-114 Return to Flight mission testing new orbital heat-shield inspection procedures.',
    whyItChanged:
      'Broke the pilot and commander glass ceilings in U.S. spacecraft command and helped restore safe Shuttle operations.',
    interestingFacts: [
      'On STS-114 (2005), she executed the first-ever Rendezvous Pitch Maneuver—flipping the Shuttle upside down beneath the ISS so station crew could photograph its heat-shield tiles.',
      'On STS-93, her crew deployed the Chandra X-ray Observatory, still studying black holes and supernovae today.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/S99-00858/S99-00858~thumb.jpg',
    imageCaption: 'Official portrait of NASA Commander Eileen M. Collins prior to STS-93.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_shuttle',
    accentColor: '#eab308',
  },
];

// ============================================================================
// 3. CHRONOLOGICAL HISTORICAL TIMELINE MILESTONES (16)
// ============================================================================

export const HISTORICAL_TIMELINE_MILESTONES: ExhibitInfo[] = [
  {
    id: 'tl_1958',
    category: 'timeline',
    title: 'NASA Established',
    subtitle: 'National Aeronautics and Space Act · July 29, 1958',
    year: '1958',
    fact: 'The National Aeronautics and Space Administration began operations on October 1, 1958.',
    background:
      'Following the Soviet launch of Sputnik 1 in 1957, the United States reorganized its civilian aeronautical research agency (NACA) into a dedicated civilian space agency.',
    whatHappened:
      'President Dwight D. Eisenhower signed the National Aeronautics and Space Act on July 29, 1958, and NASA officially opened on October 1, 1958, uniting laboratories including Langley, Ames, Lewis, and shortly after JPL.',
    peopleInvolved:
      'First NASA Administrator T. Keith Glennan, Deputy Administrator Hugh Dryden, and NACA aeronautical pioneers.',
    significance:
      'Created a unified civilian institution dedicated to peaceful aeronautical and space exploration for all humankind.',
    whyItChanged:
      'Laid the institutional foundation for Project Mercury, Apollo, space telescopes, planetary probes, and Earth observation.',
    interestingFacts: [
      'NASA started with roughly 8,000 employees inherited from the 43-year-old NACA.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/8772553/8772553~thumb.jpg',
    imageCaption: 'Early NASA Project Mercury pioneers marking the dawn of U.S. civilian spaceflight.',
    attribution: 'NASA / Public Domain',
    visualKind: 'monument_rocket',
    accentColor: '#38bdf8',
  },
  {
    id: 'tl_1959',
    category: 'timeline',
    title: 'Mercury Seven Astronauts Introduced',
    subtitle: 'NASA Astronaut Group 1 · April 9, 1959',
    year: '1959',
    fact: 'America’s first seven astronauts—Carpenter, Cooper, Glenn, Grissom, Schirra, Shepard, and Slayton—were selected for Project Mercury.',
    background:
      'To fly the first single-seat Mercury spacecraft, NASA screened over 500 military test pilots before selecting seven finalists.',
    whatHappened:
      'NASA introduced Scott Carpenter, Gordon Cooper, John Glenn, Gus Grissom, Wally Schirra, Alan Shepard, and Deke Slayton at a historic press conference in Washington, D.C., on April 9, 1959.',
    peopleInvolved:
      'The Mercury Seven astronauts and NASA Space Task Group engineers led by Robert Gilruth.',
    significance:
      'Established astronaut training, human-factors cockpit engineering, and biomedical monitoring for spaceflight.',
    whyItChanged:
      'The Mercury Seven helped shape spacecraft windows, manual controls, and crew abort systems still respected today.',
    interestingFacts: [
      'Originally the capsule had no window or manual flight controls until the Mercury Seven insisted on being pilots, not just passengers.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/8772553/8772553~thumb.jpg',
    imageCaption: 'The Mercury Seven astronauts introduced in 1959 as America’s first human spaceflight group.',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_mercury',
    accentColor: '#60a5fa',
  },
  {
    id: 'tl_1961',
    category: 'timeline',
    title: 'First American in Space',
    subtitle: 'Alan Shepard · Freedom 7 (Mercury-Redstone 3) · May 5, 1961',
    year: '1961',
    fact: 'Alan Shepard piloted Freedom 7 on a 15-minute suborbital flight, less than a month after Yuri Gagarin’s orbital flight.',
    background:
      'On April 12, 1961, Soviet cosmonaut Yuri Gagarin became the first human in space. Weeks later, NASA launched its first crewed Mercury mission.',
    whatHappened:
      'On May 5, 1961, Alan Shepard flew Freedom 7 atop a Redstone booster to an altitude of 187.5 km, successfully testing manual attitude control before splashing down safely in the Atlantic.',
    peopleInvolved:
      'Astronaut Alan B. Shepard Jr., Mercury Flight Director Chris Kraft, and Launch Director Kurt Debus.',
    significance:
      'Verified the Mercury capsule’s life support, heat shield, parachute recovery, and pilot manual control in space.',
    whyItChanged:
      'Gave NASA operational crew-flight experience, paving the way for the Moon commitment announced 20 days later.',
    interestingFacts: [
      'Ten years later, Alan Shepard commanded Apollo 14 and became the fifth person to walk on the Moon.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/6417075/6417075~thumb.jpg',
    imageCaption: 'Project Mercury flight hardware from the dawn of U.S. human spaceflight (1961).',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_mercury',
    accentColor: '#38bdf8',
  },
  {
    id: 'tl_1962',
    category: 'timeline',
    title: 'John Glenn Orbits Earth',
    subtitle: 'Friendship 7 (Mercury-Atlas 6) · February 20, 1962',
    year: '1962',
    fact: 'John Glenn completed three orbits around Earth aboard Friendship 7, becoming the first American to orbit our planet.',
    background:
      'Suborbital flights tested brief exposure to microgravity, but lunar missions required full orbital flight and high-speed atmospheric reentry.',
    whatHappened:
      'Launched atop an Atlas D rocket on February 20, 1962, John Glenn flew nearly 5 hours in orbit, manually correcting spacecraft yaw when an automatic thruster failed, before splashing down safely.',
    peopleInvolved:
      'John Glenn, Katherine Johnson, Chris Kraft, and the Mercury tracking network.',
    significance:
      'Confirmed Mercury systems and NASA tracking stations could support multi-orbit human spaceflight and high-velocity reentry.',
    whyItChanged:
      'Proved U.S. orbital capability and reinforced the value of human pilots backing up automated spacecraft systems.',
    interestingFacts: [
      'Glenn described watching thousands of glowing ice crystals—which he called "fireflies"—drifting past his window at orbital sunrise.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/S62-05540/S62-05540~thumb.jpg',
    imageCaption: 'John Glenn, pilot of Friendship 7 and first American to orbit Earth (February 20, 1962).',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_mercury',
    accentColor: '#3b82f6',
  },
  {
    id: 'tl_1965',
    category: 'timeline',
    title: 'First American Spacewalk',
    subtitle: 'Ed White · Gemini 4 · June 3, 1965',
    year: '1965',
    fact: 'Astronaut Ed White floated outside Gemini 4 for ~20 minutes, conducting the first U.S. extravehicular activity (EVA).',
    background:
      'Following Soviet cosmonaut Alexei Leonov’s historic first-ever spacewalk on Voskhod 2 in March 1965, NASA tested EVA techniques required for Apollo lunar exploration.',
    whatHappened:
      'On June 3, 1965, Ed White opened Gemini 4’s hatch while crewmate James McDivitt remained at the controls, floating above Earth on a gold-wrapped umbilical and manoeuvring with a handheld oxygen jet gun.',
    peopleInvolved:
      'Ed White (EVA pilot), James McDivitt (Command Pilot), and Gemini spacesuit engineers.',
    significance:
      'Tested pressure-suit mobility, visor glare protection, and tethered extravehicular operations in hard vacuum.',
    whyItChanged:
      'Without mastering EVA, astronauts could not have walked on the Moon, repaired Hubble, or assembled the ISS.',
    interestingFacts: [
      'White enjoyed the view so much that ground control had to remind him twice to climb back inside the capsule.',
    ],
    imageCaption: 'Technical tribute to Ed White’s Gemini 4 extravehicular activity (June 3, 1965), following Alexei Leonov’s first-ever EVA.',
    attribution: 'Historical Illustration (Gemini 4)',
    visualKind: 'astronaut_apollo',
    accentColor: '#22d3ee',
  },
  {
    id: 'tl_1969',
    category: 'timeline',
    title: 'Apollo 11 Moon Landing',
    subtitle: 'Sea of Tranquility · July 20, 1969',
    year: '1969',
    fact: 'Neil Armstrong and Buzz Aldrin landed Eagle on the Moon and took humanity’s first steps on another world.',
    background:
      'Eight years of Mercury, Gemini, Ranger, Surveyor, Lunar Orbiter, and Apollo test flights culminated in Apollo 11.',
    whatHappened:
      'Eagle separated from Columbia in lunar orbit, landed at Tranquility Base on July 20, 1969, and returned Armstrong, Aldrin, and Collins safely to the Pacific Ocean on July 24.',
    peopleInvolved:
      'Neil Armstrong, Buzz Aldrin, Michael Collins, and NASA’s Apollo team.',
    significance:
      'Humanity’s first landing and geological sample return from another celestial body.',
    whyItChanged:
      'Redefined what engineering, computing, and human ambition could achieve beyond Earth.',
    interestingFacts: [
      'Over 600 million people watched the live television broadcast of the first moonwalk.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/as11-40-5874/as11-40-5874~thumb.jpg',
    imageCaption: 'Apollo 11 astronauts on the Moon at Tranquility Base, July 20, 1969.',
    attribution: 'NASA / Public Domain',
    visualKind: 'apollo_eagle',
    accentColor: '#fbbf24',
  },
  {
    id: 'tl_1972',
    category: 'timeline',
    title: 'Landsat 1 Launched',
    subtitle: 'First Civilian Earth-Observation Satellite · July 23, 1972',
    year: '1972',
    fact: 'Landsat 1 launched the longest continuous space-based archive of Earth’s changing surface.',
    background:
      'Scientists needed standardized, repeated satellite measurements of crops, forests, water, and geology across the entire planet.',
    whatHappened:
      'Launched on July 23, 1972, Landsat 1 operated until 1978, carrying multispectral digital sensors built by Virginia Norwood’s team.',
    peopleInvolved:
      'Virginia Norwood, NASA Goddard, and the U.S. Geological Survey.',
    significance:
      'Pioneered quantitative satellite remote sensing for agriculture, hydrology, and environmental change.',
    whyItChanged:
      'Continuous 50+ year Landsat data enables humanity to track climate and land-use change objectively.',
    interestingFacts: [
      'Landsat 1 discovered a previously uncharted small island off the coast of Canada in 1976, now named Landsat Island.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA02988/PIA02988~thumb.jpg',
    imageCaption: 'Early Landsat multispectral Earth imaging.',
    attribution: 'NASA / USGS / Public Domain',
    visualKind: 'landsat_earth',
    accentColor: '#34d399',
  },
  {
    id: 'tl_1977',
    category: 'timeline',
    title: 'Voyager Spacecraft Launched',
    subtitle: 'Voyager 2 (Aug 20) & Voyager 1 (Sep 5) · 1977',
    year: '1977',
    fact: 'Twin Voyager probes launched to study the giant outer planets and eventually enter interstellar space.',
    background:
      'Engineers seized a rare 176-year alignment of Jupiter, Saturn, Uranus, and Neptune.',
    whatHappened:
      'Voyager 2 launched August 20, 1977 and Voyager 1 followed on September 5, 1977, sending back close-up revelations of moons, rings, storms, and magnetospheres before crossing into interstellar space.',
    peopleInvolved:
      'NASA JPL engineers, Ed Stone, Gary Flandro (who conceived the Grand Tour gravity-assist path), and Carl Sagan.',
    significance:
      'Completed the only spacecraft Grand Tour of all four outer giant planets (Voyager 2) and reached interstellar space (both Voyager 1 in 2012 and Voyager 2 in 2018).',
    whyItChanged:
      'Proved gravity-assist trajectories unlock the entire outer Solar System and beyond.',
    interestingFacts: [
      'Both Voyagers still transmit scientific measurements nearly half a century after launch.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA04495/PIA04495~thumb.jpg',
    imageCaption: 'Voyager spacecraft travelling past the edge of the Solar System.',
    attribution: 'NASA / JPL / Public Domain',
    visualKind: 'voyager_probe',
    accentColor: '#f59e0b',
  },
  {
    id: 'tl_1981',
    category: 'timeline',
    title: 'First Space Shuttle Orbital Flight',
    subtitle: 'STS-1 · Columbia · April 12, 1981',
    year: '1981',
    fact: 'Space Shuttle Columbia launched on STS-1, inaugurating 30 years of reusable winged spacecraft flights.',
    background:
      'NASA sought a winged orbital cargo and crew carrier capable of deploying satellites and returning to runway landings.',
    whatHappened:
      'Commanded by John Young with pilot Robert Crippen, Columbia orbited Earth 36 times over two days before gliding to a smooth landing at Edwards Air Force Base.',
    peopleInvolved:
      'John Young, Robert Crippen, and NASA Shuttle engineering teams.',
    significance:
      'First time a brand-new U.S. human spacecraft flew its maiden test flight with astronauts aboard.',
    whyItChanged:
      'Made satellite servicing, Hubble repairs, and International Space Station assembly possible.',
    interestingFacts: [
      'STS-1 launched on the 20th anniversary to the day of Yuri Gagarin’s Vostok 1 flight (April 12).',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/8111969/8111969~thumb.jpg',
    imageCaption: 'Space Shuttle Columbia’s historic maiden launch on STS-1, April 12, 1981.',
    attribution: 'NASA / Public Domain',
    visualKind: 'space_shuttle',
    accentColor: '#94a3b8',
  },
  {
    id: 'tl_1983',
    category: 'timeline',
    title: 'Sally Ride: First American Woman in Space',
    subtitle: 'STS-7 · Space Shuttle Challenger · June 18, 1983',
    year: '1983',
    fact: 'Astrophysicist Sally Ride flew aboard Space Shuttle Challenger, becoming the first American woman in space.',
    background:
      'NASA selected its first female astronaut candidates in 1978, 15 years after Valentina Tereshkova’s flight for the Soviet Union.',
    whatHappened:
      'On STS-7, Ride operated Challenger’s robotic arm to deploy communications satellites and deploy/retrieve the SPAS-01 free-flying science pallet.',
    peopleInvolved:
      'Dr. Sally Ride and the STS-7 Challenger crew.',
    significance:
      'Marked a turning point in U.S. astronaut diversity and robotic payload handling.',
    whyItChanged:
      'Inspired countless students to enter physics, engineering, and spaceflight.',
    interestingFacts: [
      'STS-7 was also the first Shuttle mission with a five-person crew.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/s07-31-1603/s07-31-1603~thumb.jpg',
    imageCaption: 'Sally Ride aboard Space Shuttle Challenger during STS-7 (June 1983).',
    attribution: 'NASA / Public Domain',
    visualKind: 'astronaut_shuttle',
    accentColor: '#38bdf8',
  },
  {
    id: 'tl_1990',
    category: 'timeline',
    title: 'Hubble Space Telescope Deployed',
    subtitle: 'STS-31 · Space Shuttle Discovery · April 25, 1990',
    year: '1990',
    fact: 'Deployed into orbit by Discovery, Hubble revolutionized modern astronomy across more than three decades.',
    background:
      'A joint project of NASA and ESA, Hubble placed a 2.4-metre optical/ultraviolet telescope above Earth’s turbulent atmosphere.',
    whatHappened:
      'Discovery deployed Hubble in April 1990; after corrective optics were installed during STS-61 (1993), Hubble transformed astrophysics from exoplanets to the deep universe.',
    peopleInvolved:
      'Nancy Grace Roman, STS-31 crew (including Steven Hawley), and five Shuttle servicing mission crews.',
    significance:
      'Delivered crisp deep-space imagery and key cosmological measurements inaccessible from ground telescopes.',
    whyItChanged:
      'Changed humanity’s picture of galaxies, nebulae, and cosmic history forever.',
    interestingFacts: [
      'Hubble has made over 1.6 million observations since 1990.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/sts061-57-021/sts061-57-021~thumb.jpg',
    imageCaption: 'Hubble Space Telescope in Earth orbit.',
    attribution: 'NASA / Public Domain',
    visualKind: 'hubble_scope',
    accentColor: '#38bdf8',
  },
  {
    id: 'tl_1998',
    category: 'timeline',
    title: 'International Space Station Construction Begins',
    subtitle: 'Zarya & Unity Modules Joined · November–December 1998',
    year: '1998',
    fact: 'First modules of the International Space Station were launched and connected in low Earth orbit.',
    background:
      'Five partner agencies—NASA, Roscosmos, ESA, JAXA, and CSA—designed a modular orbital research laboratory.',
    whatHappened:
      'The Russian-built Zarya control module launched on November 20, 1998, followed by U.S. Node 1 (Unity) aboard Space Shuttle Endeavour (STS-88), where astronauts joined them in December 1998.',
    peopleInvolved:
      'STS-88 crew, international agency leaders, and partner aerospace engineers.',
    significance:
      'Began in-orbit construction of the largest structure ever assembled in space.',
    whyItChanged:
      'Enabled uninterrupted human presence in orbit beginning in November 2000.',
    interestingFacts: [
      'Assembly required more than 40 launch flights across Russian rockets and U.S. Space Shuttles.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/s134e007114/s134e007114~thumb.jpg',
    imageCaption: 'Astronauts and cosmonauts working aboard the International Space Station.',
    attribution: 'NASA / Public Domain',
    visualKind: 'iss_station',
    accentColor: '#60a5fa',
  },
  {
    id: 'tl_2004',
    category: 'timeline',
    title: 'Opportunity Rover Lands on Mars',
    subtitle: 'Meridiani Planum · January 25, 2004',
    year: '2004',
    fact: 'Opportunity bounced onto Mars weeks after twin Spirit, uncovering strong geological evidence of ancient surface water.',
    background:
      'Orbital spectrometers spotted grey crystalline hematite—a mineral often formed in liquid water—at Meridiani Planum.',
    whatHappened:
      'Opportunity rolled right into Eagle Crater ("a 300-million-kilometre hole-in-one"), discovering layered bedrock and hematite spheres formed in wet conditions.',
    peopleInvolved:
      'NASA JPL Mars Exploration Rover mission team and Principal Investigator Steve Squyres.',
    significance:
      'Operated for nearly 15 Earth years and drove over 45 km across Martian plains and crater rims.',
    whyItChanged:
      'Provided rock-solid field evidence that Mars once had wet, habitable environments.',
    interestingFacts: [
      'Opportunity held the record for the longest distance driven on any world beyond Earth (45.16 km).',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA20285/PIA20285~thumb.jpg',
    imageCaption: 'Opportunity Rover investigating Martian bedrock.',
    attribution: 'NASA / JPL-Caltech / Public Domain',
    visualKind: 'mer_rover',
    accentColor: '#fb923c',
  },
  {
    id: 'tl_2012',
    category: 'timeline',
    title: 'Curiosity Rover Lands on Mars',
    subtitle: 'Gale Crater · August 6, 2012',
    year: '2012',
    fact: 'Curiosity touched down via the rocket-powered Sky Crane to investigate ancient Martian habitability.',
    background:
      'At nearly 900 kg, Curiosity was far too heavy for earlier airbag landings.',
    whatHappened:
      'During the dramatic "Seven Minutes of Terror," a supersonic parachute and hovering Sky Crane lowered Curiosity onto its wheels in Gale Crater on August 6, 2012.',
    peopleInvolved:
      'NASA JPL Entry, Descent & Landing team and international science collaborators.',
    significance:
      'Discovered ancient freshwater lakebeds, organic carbon molecules, and key chemical ingredients for life.',
    whyItChanged:
      'Validated heavy precision planetary landing technology needed for Perseverance and future crewed landers.',
    interestingFacts: [
      'Curiosity’s laser (ChemCam) zaps rocks from up to 7 metres away to read their elemental composition.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~thumb.jpg',
    imageCaption: 'Curiosity rover in Gale Crater, Mars.',
    attribution: 'NASA / JPL-Caltech / MSSS / Public Domain',
    visualKind: 'curiosity_rover',
    accentColor: '#f97316',
  },
  {
    id: 'tl_2021_perc',
    category: 'timeline',
    title: 'Perseverance and Ingenuity Reach Mars',
    subtitle: 'Jezero Crater · February 18, 2021',
    year: '2021',
    fact: 'Perseverance landed in Jezero Crater to sample ancient delta rocks while Ingenuity achieved powered flight on Mars.',
    background:
      'Scientists selected Jezero Crater because orbital imagery revealed a fan-shaped river delta where water poured into an ancient lake.',
    whatHappened:
      'Perseverance landed safely using Terrain-Relative Navigation; two months later on April 19, 2021, Ingenuity lifted off for humanity’s first powered flight on another planet.',
    peopleInvolved:
      'NASA JPL Mars 2020 and Ingenuity teams.',
    significance:
      'Proved powered rotorcraft flight works on Mars and demonstrated oxygen production from Mars’s CO2 atmosphere via MOXIE.',
    whyItChanged:
      'Pioneered aerial planetary scouting and sample-caching exploration.',
    interestingFacts: [
      'Ingenuity was originally planned as a 5-flight technology test and went on to complete 72 flights.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA25970/PIA25970~thumb.jpg',
    imageCaption: 'Perseverance watches Ingenuity fly above Jezero Crater.',
    attribution: 'NASA / JPL-Caltech / Public Domain',
    visualKind: 'perseverance_ingenuity',
    accentColor: '#38bdf8',
  },
  {
    id: 'tl_2021_jwst',
    category: 'timeline',
    title: 'James Webb Space Telescope Launched',
    subtitle: 'NASA / ESA / CSA · December 25, 2021',
    year: '2021',
    fact: 'Launched aboard an Ariane 5 rocket, JWST unfolded in deep space to probe the infrared cosmos.',
    background:
      'Studying the earliest stars and exoplanet atmospheres required a cold, giant infrared telescope operating far from Earth’s heat.',
    whatHappened:
      'After a flawless Ariane 5 launch on December 25, 2021, JWST executed more than 300 single-point-of-failure deployment steps during its million-mile journey to L2.',
    peopleInvolved:
      'NASA, ESA, and CSA engineers, scientists, and Ariane launch teams.',
    significance:
      'Delivered unprecedented infrared sensitivity across galaxies, stellar nurseries, and planetary atmospheres.',
    whyItChanged:
      'Revealed the earliest galaxies ever observed and opened atmospheric spectroscopy of rocky worlds.',
    interestingFacts: [
      'JWST orbits the Sun–Earth L2 point roughly 1.5 million kilometres from Earth—almost four times farther than the Moon.',
    ],
    imageUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000422/GSFC_20171208_Archive_e000422~thumb.jpg',
    imageCaption: 'James Webb Space Telescope 18-segment gold primary mirror.',
    attribution: 'NASA / Chris Gunn / Public Domain',
    visualKind: 'jwst_mirror',
    accentColor: '#eab308',
  },
];

export const ALL_MUSEUM_EXHIBITS: ExhibitInfo[] = [
  ...Object.values(NASA_BREAKTHROUGH_EXHIBITS),
  ...FAMOUS_ASTRONAUT_EXHIBITS,
  ...HISTORICAL_TIMELINE_MILESTONES,
];

export function findMuseumExhibitById(id: string): ExhibitInfo | undefined {
  return ALL_MUSEUM_EXHIBITS.find((e) => e.id === id);
}
