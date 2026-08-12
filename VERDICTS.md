# Verdicts

Blind A/B results, newest last. `scripts/review.mjs` appends these automatically when you
submit a verdict.

Do not edit a verdict after the reveal. If you disagree with your own scoring after seeing
which arm won, that disagreement is itself the finding — write it as a new note rather than
changing the score.

## Scoreboard

Overall winner per scored round. Rebuilt from the verdict blocks below on every
submission — do not edit this table by hand. To retract a round after the fact,
add `<!-- void: <run-directory> -->` on its own line; the two below are the
202608090424 pairs whose control arm was never edited before the provider usage
limit hit.

<!-- void: editorial-longform__with__202608090424 -->
<!-- void: saas-analytics__with__202608090424 -->

| Scenario | With Dreative | Without | Tie |
|---|---|---|---|
| civic-clinic | 1 | 0 | 0 |
| coffee-roaster | 2 | 3 | 0 |
| devtool-docs | 1 | 1 | 0 |
| editorial-longform | 2 | 0 | 0 |
| saas-analytics | 1 | 1 | 0 |
| **Total** | **7** | **5** | **0** |

## Notes across rounds

- **2026-08-08, editorial-longform.** The reviewer stated with confidence that the control
  was the Dreative build ("i know this is definitely dreative, and is really bad") while
  scoring it the loser on five of six criteria. The guess was inverted. Blind scoring is
  doing real work; an unblinded round would have recorded the opposite result.
- Direction was unstated in that round, so the skill fell back to Recommended and the
  reviewer correctly noticed the absence of Showcase-level motion. Rounds now pass
  `--direction` explicitly.
- **2026-08-10, imagery.** Earlier rounds were noted here as offline. That was wrong: both
  arms run with network access, so neither arm was prevented from sourcing photography —
  they chose to fabricate it. Fabricated product imagery was the single sharpest complaint
  in the set ("the lighthouse image is soo bad", "the prop image... I don't really like").
  This is a skill failure, not a harness gap, and the external-media-first rule was
  strengthened in response. Judge generated imagery as a decision, not as a limitation.
- **2026-08-11, what "smooth" actually means.** The reviewer finally named the control's
  standing advantage, and it is not big animation. It is that *every* element responds:
  subtle enter-on-scroll, and colour/background/shadow/gradient shifts on interaction,
  everywhere, all the time. Dreative "only amplifies" — a few strong signature moments
  with flat, transition-less material between them. The motion floor counts signature
  moments and cannot see this: a route can clear it and still feel dead. Baseline
  responsiveness across ordinary elements is the gap, not more spectacle.
- **2026-08-11, scroll triggers.** Dreative's scroll effects fired outside the viewport,
  so they had already played by the time the section was on screen. A motion check that
  only asks whether state changed will pass this.

---

<!-- paste verdict records below this line -->

## editorial-longform — 2026-08-08

- with:    `editorial-longform__with__202608081241`
- without: `editorial-longform__without__202608081241`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | WITH Dreative |
| Hierarchy and pacing | Tie |
| Craft | WITH Dreative |
| Mobile | WITH Dreative |
| Restraint | WITH Dreative |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** this is better, tho it lacks animation and not really showcase i expect (unless u tell me this is default to recommended) its clean,nice and genuine impressive with graph animation etc

**Feedback on the control:** The lighthouse image is soo bad omg, it looks like it generated itslef, it didnt outsource, find images, reference, or generally generate a good realistic one base on the themne. tbh i know this is definitely dreative, and is really bad. i mean other than the image, the rest look identical ish from the screenshot. but using live, there is minial animation, tho mroe than option A, but it seems easy animation liike enlarging etc. nothing crazy unlike A where there is a graph and it has its own animation, and idk why live is dark theme when the screenshot isnt

**Summary:** While the winner has cleaner style, archiecture, and colour and flow. it is quite static but there is unique animation whcih is cool, unlike the loser, its easy animation on scroll first, but has no unqiue animation or good ones, and the image is stupidly uigly. the best thing about the loser i guess is that it generall had more animations, tho i can be a good and bad thing

## civic-clinic — 2026-08-09

- with:    `civic-clinic__with__202608090424`
- without: `civic-clinic__without__202608090424`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | control |
| Hierarchy and pacing | Tie |
| Craft | WITH Dreative |
| Mobile | WITH Dreative |
| Restraint | Tie |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** This definitely look more professional, and non ai slop and cleaner, but its form is not as nice as design B and, it did tables instead of cards which look clean, but the hero card is a square , no border, looks pretty weird. it lacks the use of icons but it looks cleaner because it has minimal colour choice

**Feedback on the control:** this look so ai slop HAHAHH, urm the colour choice is nice but cards are rounded border, it just defionitely look like ai done it. alsot he mobile isnt interactive and responsive. anmd live view, some stuff are overly sized

**Summary:** the winner has minimal icon and image use, and colour choice quite minimal tho is a good and bad thing. i would say design A using cards would be btr to highlight the important points, dont need to be card but just text and table is hard to diffrientiate. the best thing about B is using of icons and cards for clarity, and colour choice suite the theme clinic

## coffee-roaster — 2026-08-09

- with:    `coffee-roaster__with__202608090424`
- without: `coffee-roaster__without__202608090424`

| Criterion | Winner |
|---|---|
| Distinctiveness | control |
| Fit to the product | control |
| Hierarchy and pacing | control |
| Craft | control |
| Mobile | Tie |
| Restraint | Tie |
| **Overall** | control |

**Feedback on the Dreative build:** this look very professional and clean, thje animation for graph is nice and thge prop image is way btr than design A. however, theres alot of text chunked up, its hard to really understand, compaered to the other design, have cards, [placeholders etc it helps to tell a story and action . tbh it has no clear separation and design A just looks more easy to understand

**Feedback on the control:** This is deadass nice, but the use of prop images, i think it sided with generating 3d props or smth, i dont really quite like the prop image, animation is smooth and minimal crazy, quite nice. cards look professional. but compare to the other, the graph looks sad, however it looks more premium, definitewly has more potential. i like the footer too

**Summary:** worst thing about design A is prop image, and there is no graph animation like design B, tho those section mean different thing. best thign about the loser is prop image and use of animation for graph and a graph to show the cycle which is quite interesting

## devtool-docs — 2026-08-09

- with:    `devtool-docs__with__202608090424`
- without: `devtool-docs__without__202608090424`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | control |
| Hierarchy and pacing | WITH Dreative |
| Craft | WITH Dreative |
| Mobile | Tie |
| Restraint | control |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** this looks very professional and good, tho no clear seperation and a little harder to understand, actually not sure, because the use of tables is not too bad, to be honest is objective, but definitely it looks way btr and cleaner, not much animation and use of design thiungs to sybolize "dev code" tho

**Feedback on the control:** this is so ai slop, so many colour ways but is code so i get it. i like tghe use of cardds and seperation and it just overall has more animation and stuff. its cards and design is more unique in terms of like cli card, which the other one doesnt have, but it looks slop

**Summary:** Worst abut the winner is that it does desing things fit to the theme, like rn it just has nothing that truly stands out as dev, like the other has a command line card, looks pretty sick, the seperation is controversial. the besrt about the loser is using of unique design and more colour way to distinguish code etc.

## editorial-longform — 2026-08-09

- with:    `editorial-longform__with__202608090424`
- without: `editorial-longform__without__202608090424`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | Tie |
| Hierarchy and pacing | Tie |
| Craft | Tie |
| Mobile | Tie |
| Restraint | Tie |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** i mean it has a image i guess, there is a big blank space tho, dk if it means anything, and the nav bar is not alinged

**Feedback on the control:** looks bloody the ame haha, just no image

**Summary:** urm itg looks the same, just the loser doens thvae  aproper image and has aligned header. tho the loser does have lesser words ig

## saas-analytics — 2026-08-09

- with:    `saas-analytics__with__202608090424`
- without: `saas-analytics__without__202608090424`

| Criterion | Winner |
|---|---|
| Distinctiveness | Tie |
| Fit to the product | Tie |
| Hierarchy and pacing | Tie |
| Craft | Tie |
| Mobile | Tie |
| Restraint | Tie |
| **Overall** | Tie |

**Feedback on the Dreative build:** —

**Feedback on the control:** —

**Summary:** its thge same thing, i think something went wrong here

## Correction — 2026-08-09

Round 202608090424 hit the provider usage limit part-way through. Two of the five verdicts
are void and must not be counted:

- **editorial-longform** — the control arm was never edited. The Dreative build was scored
  against the untouched seed project, so its win means nothing.
- **saas-analytics** — both arms were the untouched seed and were byte-identical. The tie
  was structural.

Standing after this round: **civic-clinic** and **devtool-docs** to the Dreative build,
**coffee-roaster** to the control. coffee-roaster and devtool-docs both ended on the usage
limit, so their designs may be cut off.

## editorial-longform — 2026-08-09

- with:    `editorial-longform__with__202608091149`
- without: `editorial-longform__without__202608091149`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | WITH Dreative |
| Hierarchy and pacing | WITH Dreative |
| Craft | WITH Dreative |
| Mobile | Tie |
| Restraint | WITH Dreative |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** definitely, this is very good, its clean, nice minimal animation, images used are very nice i like, if we are talking about design tho, idk if its the prompt since the other design also somewhat the same, but ya its a little plain with alot of words, tho tbh this is a editorial long form so that my words grain of salt, also i wish theres more nimation but, ya its recommended may not fit it.

**Feedback on the control:** i can see the vision fore the animation, but its so ugly and not working, animations definitely not as clean, good ans accurate as design B, but the hero animation i can see potential

**Summary:** worst thing about the winner is that, not mch animation, but its recommended soo, is clean and nice tho. best thing about the loser is using of lights and animation to simulate a lighthouse, potential and creative but execute wrong

## saas-analytics — 2026-08-09

- with:    `saas-analytics__with__202608091149`
- without: `saas-analytics__without__202608091149`

| Criterion | Winner |
|---|---|
| Distinctiveness | control |
| Fit to the product | WITH Dreative |
| Hierarchy and pacing | control |
| Craft | control |
| Mobile | Tie |
| Restraint | control |
| **Overall** | control |

**Feedback on the Dreative build:** this is just hella plain, no animation, no nothing, the graphs i guess is nice, but ya just plain and boring. but its sections and the way is being puit together is interesting, compare to the other one, this has more explanation and a little more meaning. like there is 
Change the definition. Watch everything downstream move with it. operation and is interactive showing what the system does, something the other design lackjs. and theres a graph to show performance in production

**Feedback on the control:** omg this is fucking sicks, one of the ebstr design i seen and "produce" is clean, animations are insane, super creative design and use of animations and card, clear, sick, flows right. tho the freqenmtly asked section doesnt really work, not sure if this is design flaw.

**Summary:** worst about the winner is that, it lacks proper display of important and making sure user understands properly, like the other design, it shows 
Change the definition. Watch everything downstream move with it. and a true interactive component with graphs etc, and theres a graph and pretyt nice too to show performance in production. tho i ahve to say, the design is really good. the other has mor emeaning and more detailed with real interaction, but the design is really plain and boring

## coffee-roaster — 2026-08-09

- with:    `coffee-roaster__with__202608091621`
- without: `coffee-roaster__without__202608091621`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | Tie |
| Hierarchy and pacing | control |
| Craft | control |
| Mobile | Tie |
| Restraint | WITH Dreative |
| **Overall** | control |

**Feedback on the Dreative build:** this is bold, expressive, but it executed wrong alot, like it definitely looks way off, but its distinct and expressive, unqiue and interesting animation for showcase, tho the colour choice is weired for props and the cofeebeans dont look like it. the brew guide looks messy and hard to understabnd, i like the orb shifting and resizing while u scrol it looks likes a graph, just shit execution

**Feedback on the control:** This is clean, minimal, noithing can go wrong, quite decent witrh graph animatiion and some other animation, tho is a little plain if uw showcase. and prop image is fine

**Summary:** worst thing about the winner is the lack of animations, is quite plain and boring, repittied graph and sliding animation. tho nothing can go wrong with it, the loser, bold expressive, but too much wrong details, confusing colours and elements, like the orb spinning with multiple beans etc. best thing about the loser is its distinctiveness and unique interesting design.

## saas-analytics — 2026-08-09

- with:    `saas-analytics__with__202608091621`
- without: `saas-analytics__without__202608091621`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | WITH Dreative |
| Hierarchy and pacing | WITH Dreative |
| Craft | WITH Dreative |
| Mobile | control |
| Restraint | WITH Dreative |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** yooo this is very tough, unique, correctly executed animation, it brings story and has a purpose, tho it doenst have many animations but when it has, its super good. tho i have to say mobile doesnt look as impressive

**Feedback on the control:** this is generic, like i can tell rightr away is claude already, always the same design with graph and floating stuff. urm the animations are minimal, theres alot but nothing packs a punch and is not impressive. looks lioke every other website that is non ai slop

**Summary:** worst thing about winner is that eventhouugh it has unique animation and is showcase, urm number of it is little, like the rest feels pretty static, a least soime minimal animations can help, , tho i do like how it generates graph to explain, pretty understandable and clean. the bestr thing about the loser is more animations, and better as mobile i guess

## coffee-roaster — 2026-08-10

- with:    `coffee-roaster__with__202608101213`
- without: `coffee-roaster__without__202608101213`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | WITH Dreative |
| Hierarchy and pacing | WITH Dreative |
| Craft | control |
| Mobile | Tie |
| Restraint | WITH Dreative |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** this is definitely unique, interesting and nice, the use of images are very good, tho very static, urm it has some animation regarding scrol effects. theres some interactivity with the graph but, the graph is hella ugly ngl, compared the ones i seen by claude control, this is underwhelming, well because mostly thios is interactive and not jsut a video or smth like claude (mayvbe a asset). ik this is recommended but, compared to design A, generally it has not much animation, mor eunioque ones but not extremely crazy, just small scroll effects and grapgh interactivity. the images, text and everything dont animate, theres very little animation even if its small. tho i have to say is a little easier to understand. for this, theres some spacing problems for texts and stuff,  and i do prefer design A where the props are highlighted tho with just colour, our is just with graph and logs, which is weired cause we are selling cofee uk, props

**Feedback on the control:** ya expected from cl;aude, is always the same generic simple nothing can goi wrong animation, smooth and nice but still, nothing special or unique. prop images jsut show colour and is not even layout nicely

**Summary:** winner just won by abit, but the worst thing is lack of animations in total since it may or maynot be recommendation, urm just frw scroll effects not bizare or unique, and not much overall smooth animation like the loser. loser has props with atleast pl;aceholder, while ours is a graph log which makes things confusing and not really a ecommerce website while adding confusing since the graph looks wrongly executed and ugly.

## coffee-roaster — 2026-08-11

- with:    `coffee-roaster__with__202608110146`
- without: `coffee-roaster__without__202608110146`

| Criterion | Winner |
|---|---|
| Distinctiveness | control |
| Fit to the product | control |
| Hierarchy and pacing | control |
| Craft | control |
| Mobile | Tie |
| Restraint | control |
| **Overall** | control |

**Feedback on the Dreative build:** this whole thing is messy, its hard to understand, is like cramping too much ambitions and words and design.  its design, text,images and theyw ay it uses graph and props are so confusing and uncessary. theres so much stats everywhere. i can see the creativity b ut no user experience, also its messy and iugly, the graph execution and in general. it lacks animation overall too and nothing distcit

**Feedback on the control:** this is clean, mordern, slit, and smooth calm animation, nothing bizare and nothing can go wrong, is easy to understand  and genuine good ecommerce website

**Summary:** best thign about the loser is its ambition i guess, but its genuine messy and wrongly executed, design doesnt look good, go see it urself. worst thing about the winner is ig, lack of using of images, its animations are plain and overused, notjing unique, design is generic

## coffee-roaster — 2026-08-11

<!-- Entered by hand after the round was archived: the reviewer judged the pair live
     but committed before submitting, and `runs/` no longer held both arms on pull.
     Wording is the reviewer's own, transcribed verbatim. -->

- with:    `coffee-roaster__with__202608110800`
- without: `coffee-roaster__without__202608110800`

| Criterion | Winner |
|---|---|
| Distinctiveness | WITH Dreative |
| Fit to the product | WITH Dreative |
| Hierarchy and pacing | WITH Dreative |
| Craft | WITH Dreative |
| Mobile | Tie |
| Restraint | WITH Dreative |
| **Overall** | WITH Dreative |

**Feedback on the Dreative build:** for this showcase, is less confusing, images are used really well here, tho abit static, still looks nice overall, i do see more unique and nice animations for some sections, like interaction does make it looks nice when zoom in and blur for images, tho prop section didnt really highlight the props/products well when adding to cart, but did show the other props like colour/type of coffee really well (not the product, the type), the product the image looks small and a little irrelevant (add to cart section). some section got nice scroll animation but it isnt fit within user view, so after i scroll pass section then there is scroll effects, so pretty weird and bad ux, but pretty nice. somehow this run tho not as easy to understand as claude control, still pretty neat and not as messy as previous run. a cool part of dreative interactivity is a fact i didnt observe in: when i select the type of bean, it highlights and enlarges text/image of that product that relates to the type, super cool and nice effect while being useful, but not as well executed cause if just one product has that type, its overly big, and highlighting that certain product, the others look super tiny in comparison. and only when i select certain interaction does the scroll effect work properly. i do see the vision but images are too cut/cramped together and some specific outcomes has no image/relevant one. dreative in general eventhough other text/sections have stuff, it remains plain and no transition/smooth ones like claude, it generally only amplifies since there is some few unique ones

**Feedback on the control:** the claude control, i realize something that always make it seems smooth, its its transition and the way u interact with stuff. like when i scroll, theres minimal but still subtle clean transition of it popping up or sliding something like that, same goes with interacting where it changes colour/background/shadow to match the background or add a little gradient making it look "cool" and interactive, popping up and smooth, tho very overused and not unique. theres also custom animation (tho always overused by claude) like names sliding from left to right infinitely. tho product/prop image not as good a source, its better in clarifying this product is add to cart/for sale like, there are cards with big images and text. is also much less wordy and cleaner in separation

**Summary:** overall i give dreative cause claude is really bland and boring and those, nothing can go wrong websites that dont look half bad but look like lovable did it with the prompt saying "no ai slop". dreative won on distinctiveness, fit, hierarchy, craft and restraint, mobile tie. worst thing about the winner: scroll effects fire outside the viewport so they land after you've already passed the section, the add-to-cart product image is small and irrelevant, the bean-type highlight over-scales when only one product matches, and everything outside the few signature moments is still flat with no transitions. best thing about the loser: subtle scroll and hover transitions everywhere, and cards with big images and text that make it obvious what is for sale.

## devtool-docs — 2026-08-11

- with:    `devtool-docs__with__202608111359`
- without: `devtool-docs__without__202608111359`

| Criterion | Winner |
|---|---|
| Distinctiveness | control |
| Fit to the product | control |
| Hierarchy and pacing | control |
| Craft | control |
| Mobile | Tie |
| Restraint | control |
| **Overall** | control |

**Feedback on the Dreative build:** this is horibble, its using image, not sure if its image or generating,  but its so complex, wordy, not clear presentation, and i think the ban of borders is so strict to the point it only uses rectangle. on scroll through the website and its so confusing, i do like the mini animation for hero bbut thats it

**Feedback on the control:** this si good, clean, mordern nice, good animations, miniminalistic and clean. genuine design that reduce perplexity and confusion, cli looking cards to look like theme etc

**Summary:** worst thing about the winner is lack of animation and good ones, but its still pretty ok cause its a devtool doc, the animations are minimistic but relates to the type and environment. best thing about the loser is just that interesting unique hero animation that all, its messy, cramped, not tidy, everywhere, rectangles,  but i have to say, its really good with details and explanation + interaction, like interactions are actually meaningful and docs do shiw more content
