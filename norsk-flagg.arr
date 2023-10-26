base = rectangle(300, 150, "outline", "white")
bl = square(60, "solid", "red")
mash =overlay-align("left", "bottom",
  bl, base)

#lagde først en outline rektangle som ble "hoved" rektagelen i flagget.

tl = square(60, "solid", "red")
lash =overlay-align("left", "top", tl, mash)

#deretter lagde jeg flere variabler med rektangler som jeg "limte" inn sammen med hovedrektagelen 

tr = rectangle(180, 60, "solid", "red")
dash =overlay-align("right", "top", tr, lash)


br = rectangle(180, 60, "solid", "red")
gash =overlay-align("right", "bottom", br, dash)

#neste steg startet jeg med blå fargen

re = rectangle(300, 10, "solid", "blue")
toge =overlay-xy(re, 0, -70,
  gash)

te = rectangle(40, 150, "solid", "blue")
final =overlay-xy(te, -70, -0, toge)
final

#jeg lagde flere variabler hele veien, re og te variablene gjorde jeg litt forskjellig å få tilpasse det endelig flagget med blå fargen
