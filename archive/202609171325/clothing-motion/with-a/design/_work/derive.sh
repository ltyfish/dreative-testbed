set -e
declare -A M=(
 [oxford]=g-hangers.jpg [tee]=g-knitfold.jpg [chore]=g-jacketflat.jpg [overshirt]=g-woolcoat.jpg
 [trouser]=g-trouserflat.jpg [jean]=g-denimdetail.jpg [knit]=g-knitform.jpg [cardigan]=g-knitpurple.jpg
 [shorts]=g-shorts.jpg [hero]=g-rail.jpg [backdrop]=cloth-linen-a.jpg
)
for k in "${!M[@]}"; do
  src="design/_work/img/${M[$k]}"
  ffmpeg -y -loglevel error -i "$src" -vf "scale=1400:-2:flags=lanczos" -q:v 7 "public/img/$k-1400.jpg"
  ffmpeg -y -loglevel error -i "$src" -vf "scale=700:-2:flags=lanczos"  -q:v 7 "public/img/$k-700.jpg"
done
