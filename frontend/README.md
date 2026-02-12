# Knowle

## Goals

[Froom](https://froom.bathcs.com) is a great tool for finding a free room on campus. But is that automatic door working today?

The goal of Knowle (name subject to change) is to make accessibility issues discoverable.
The original Froom has recieved praise for its simple interface and accurate data, and this project aims to replicate that success for accessibility issues and faults impacting accessibility.
The primary focus is on physical accessibility but this scope could be extended in the future if this seems useful.

## Design

There are two ways that data could be presented: by building/floor, and on a map. Some issues may simultaneously be in multiple buildings.

Generating a map could use the data from the [Floor Plans project](https://gitlab.bath.ac.uk/pm2022/floor-plans), although it is likely that this code would need rewriting to be fully automated.
The map data could also be crowdsourced. This would also solve an adjacent problem, relating to the navigability of campus. Some rooms are very hard to find, even for fully-sighted neurotypical students.
If map data is crowdsourced and structured effectively, this could facilitate a future campus route-finding tool.
While this is out of scope for this project, it should be considered in the database design.

There should also be a button to launch the user's email client to email Campus Infrastructure with a template email, such that the user just has to fill out the details of the issue.
Alternatively a direct reporting mechanism could be established, but this would be more work and run higher risks of security issues.

## Minimal Viable Product

The initial release should:
- support at least one data source
- list accessibility issues in a user-centric view
  - this will likely require categorization of issue type (e.g. broken lift or automatic door failure) and location (affected buildings or areas, e.g. 1 West or Parade)
- be highly accessible to most users
  - accessibility must be improved in future releases based on feedback or consultation

## Data sources

Several possible data sources exist:

1. [Email notifications available from Campus Infrastructure](https://www.bath.ac.uk/services/receive-email-notifications-from-the-campus-infrastructure-team/)
2. Crowdsourcing data (when logged in with University account only)
  - this will require a method to remove outdated information
  - some level of moderation may also be required, although delegating to official University processes is likely sufficient
3. Other ideas welcome!

## Caveats

It must be made clear whether data is authoritative and what the delay period is. Moderation tools will be required if crowdsourcing is implemented.

## Acknowledgements

Idea proposed in SUmmit by Sofiia Furman. Initial idea from discussions by Isabella Eng and Isabella Downer.

## Contacts

- Sofiia Furman: sf2049@bath.ac.uk
- Disability Action Group (for advice on user needs; please bear in mind that these are volunteer students and may not have time to help): su-disabilityaction@bath.ac.uk
- Tony Griffin (Deputy Director of Campus Infrastructure; very keen on student voice): asg79@bath.ac.uk
- Penn Mackintosh (knows a lot about the University's computer aided facilities management system and has access to the raw map data): pm2022@bath.ac.uk
- TBC (project lead): your name here?

## Name Ideas

I'm aiming for a name that's a pun on a nearby town, to match Froom

Current ideas:

- Knowle (know lifts and entrances/exits)
- Notton (a pun on "not on", which can be interpreted either as the common state for the East Lift, or as a response to hearing about accessibility issues, i.e. "that's just not on")
- Something about Holt, a nearby village
- Minster Way (a road near the sham castle; sounds like "min stairs way", i.e., a route that has no steps and therefore may be more accessible to wheelchair users)
