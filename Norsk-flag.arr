use context essentials2021
base = rectangle(300, 150, "outline", "white")
bl = square(60, "solid", "red")
mash =overlay-align("left", "bottom",
  bl, base)

#lagde først en firekant og plaserte det inn i "hoved" rektagelen.

tl = square(60, "solid", "red")
lash =overlay-align("left", "top", tl, mash)

#deretter lagde jeg en variable med rektangler som jeg "limte" inn sammen med hoved rektagelen 

tr = rectangle(180, 60, "solid", "red")
dash =overlay-align("right", "top", tr, lash)


br = rectangle(180, 50, "solid", "red")
gash =overlay-align("right", "bottom", br, dash)


re = rectangle(300, 15, "solid", "blue")
toge =overlay-xy(re, 0, -70,
  gash)

te = rectangle(37, 150, "solid", "blue")
final =overlay-xy(te, -70, -0, toge)
final

#jeg lagde flere variabler hele veien, re og te variablene gjorde jeg litt forskjellig


