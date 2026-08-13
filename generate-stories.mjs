import { writeFile } from "node:fs/promises";

const localized = (en, id) => ({ en, id });
const expression = (id, direction) => ({ id, direction });
const cast = (...entries) => entries.map(([characterID, asset]) => ({ characterID, asset }));
const bubble = (speakerID, en, id) => ({ speakerID, text: localized(en, id) });

const actions = {
  approach: {
    id: "action_approach",
    name: localized("Approach", "Dekati"),
    direction: "A calm caregiver moving closer at the child's eye level with open, non-threatening body language."
  },
  crayon: {
    id: "action_crayon",
    name: localized("Crayon", "Krayon"),
    direction: "One clearly recognizable drawing crayon with a simple silhouette."
  },
  toy: {
    id: "action_toy",
    name: localized("Toy", "Mainan"),
    direction: "A small, friendly cat toy that reads clearly at card size."
  },
  attentionReset: {
    id: "action_attention_reset",
    name: localized("Attention Reset", "Atur Ulang Perhatian"),
    direction: "Two hands clapping once to regain attention without intimidating the child."
  },
  askQuiet: {
    id: "action_ask_quiet",
    name: localized("Ask to Be Quiet", "Minta Tenang"),
    direction: "A gentle quiet gesture with one finger near the mouth and a relaxed expression."
  },
  lecture: {
    id: "action_lecture",
    name: localized("Lecture", "Tegur"),
    direction: "A firm but calm corrective gesture, without yelling or intimidating body language."
  },
  asking: {
    id: "action_asking",
    name: localized("Ask", "Tanya"),
    direction: "A calm question bubble and attentive listening gesture."
  },
  candy: {
    id: "action_candy",
    name: localized("Candy", "Permen"),
    direction: "A small wrapped candy with a distinct silhouette."
  },
  paper: {
    id: "action_paper",
    name: localized("Paper", "Kertas"),
    direction: "A clean replacement sheet of drawing paper."
  },
  blaming: {
    id: "action_blaming",
    name: localized("Blame", "Menyalahkan"),
    direction: "An accusatory pointing gesture with a sharp question mark to show judgment before listening."
  },
  apologize: {
    id: "action_apologize",
    name: localized("Apologize", "Minta Maaf"),
    direction: "Two paws meeting in a mutual apology and reconciliation gesture."
  },
  giveBandage: {
    id: "action_give_bandage",
    name: localized("Give Bandage", "Berikan Plester"),
    direction: "A clean adhesive bandage held ready for first aid."
  },
  lollipop: {
    id: "action_lollipop",
    name: localized("Lollipop", "Permen Lolipop"),
    direction: "A round, colorful lollipop on a short stick."
  }
};

const backgrounds = {
  classroom: {
    id: "background_classroom",
    direction: "A warm classroom with drawing supplies, clear floor space for characters, and quiet areas for text bubbles."
  },
  playground: {
    id: "background_playground",
    direction: "A friendly outdoor playground with a slide, soft ground, open character space, and room for text bubbles."
  }
};

const expressionDirections = {
  neutral: "Relaxed neutral posture that can support listening, waiting, or ordinary conversation.",
  happy: "Open happy expression with an easy smile and positive body language.",
  sad: "Lowered ears and gaze with a clearly sad but not crying expression.",
  crying: "Visible tears, trembling mouth, and a distressed crying expression.",
  angry: "Angry expression with tense brows and firm, closed body language.",
  frustrated: "Frustrated expression with tense shoulders and an impatient posture.",
  questioning: "Head tilted with raised brows, showing confusion or questioning an unclear action.",
  defensive: "Guarded posture with crossed arms or pulled-back shoulders.",
  calm: "Calm breathing, relaxed shoulders, and a settled expression.",
  relieved: "Relieved expression with softened eyes and released tension."
};

const generalExpressions = new Map(
  ["jojo", "rhodey"].flatMap(characterID => Object.entries(expressionDirections).map(([emotion, direction]) => {
    const displayName = characterID === "jojo" ? "Jojo" : "Rhodey";
    const asset = {
      id: `${characterID}_${emotion}`,
      type: "expression",
      direction: `${displayName}: ${direction}`
    };
    return [asset.id, asset];
  }))
);

const uniquePoses = new Map([
  ["jojo_drawing", {
    id: "jojo_drawing",
    type: "pose",
    direction: "Jojo seated and drawing; the crayon and drawing surface are included in this complete image."
  }],
  ["rhodey_drawing", {
    id: "rhodey_drawing",
    type: "pose",
    direction: "Rhodey seated and drawing; the crayon and drawing surface are included in this complete image."
  }],
  ["rhodey_crying_torn_paper", {
    id: "rhodey_crying_torn_paper",
    type: "pose",
    direction: "Rhodey crying while holding two visibly torn pieces of his drawing paper."
  }],
  ["rhodey_holding_new_paper", {
    id: "rhodey_holding_new_paper",
    type: "pose",
    direction: "Rhodey happily holding one clean replacement sheet, ready to draw again."
  }],
  ["rhodey_injured_sitting", {
    id: "rhodey_injured_sitting",
    type: "pose",
    direction: "Rhodey sitting after a fall and holding one scraped knee; usable before first aid is applied."
  }],
  ["rhodey_bandaged", {
    id: "rhodey_bandaged",
    type: "pose",
    direction: "Rhodey with a visible bandage already applied to his knee; a complete image requiring no overlay."
  }],
  ["jojo_rhodey_handshake", {
    id: "jojo_rhodey_handshake",
    type: "pose",
    direction: "One combined illustration of Jojo and Rhodey facing each other and shaking paws after a mutual apology."
  }]
]);

const rawVisualMapping = {
  jojo_attentive: "jojo_neutral",
  jojo_awkward: "jojo_questioning",
  jojo_calm: "jojo_calm",
  jojo_defensive: "jojo_defensive",
  jojo_distracted: "jojo_questioning",
  jojo_drawing_happy: "jojo_drawing",
  jojo_excluded: "jojo_sad",
  jojo_handshake_happy: "jojo_rhodey_handshake",
  jojo_heard: "jojo_relieved",
  jojo_honest: "jojo_neutral",
  jojo_hurt: "jojo_sad",
  jojo_listening: "jojo_neutral",
  jojo_noisy: "jojo_happy",
  jojo_partially_heard: "jojo_questioning",
  jojo_ready_to_repair: "jojo_calm",
  jojo_relieved: "jojo_relieved",
  jojo_resistant: "jojo_frustrated",
  jojo_safe: "jojo_calm",
  jojo_upset: "jojo_angry",
  jojo_validated: "jojo_relieved",
  jojo_worried: "jojo_sad",
  jojo_worried_accused: "jojo_sad",
  rhodey_attentive: "rhodey_neutral",
  rhodey_awkward: "rhodey_questioning",
  rhodey_bandaged: "rhodey_bandaged",
  rhodey_bandaged_uncertain: "rhodey_bandaged",
  rhodey_calm_injured: "rhodey_injured_sitting",
  rhodey_calming: "rhodey_calm",
  rhodey_comfortable: "rhodey_calm",
  rhodey_crying_injured: "rhodey_injured_sitting",
  rhodey_crying_torn_paper: "rhodey_crying_torn_paper",
  rhodey_curious: "rhodey_questioning",
  rhodey_defensive: "rhodey_defensive",
  rhodey_distracted: "rhodey_questioning",
  rhodey_distracted_candy: "rhodey_questioning",
  rhodey_drawing_happy: "rhodey_drawing",
  rhodey_explaining: "rhodey_neutral",
  rhodey_frustrated: "rhodey_frustrated",
  rhodey_handshake_happy: "jojo_rhodey_handshake",
  rhodey_happy_new_paper: "rhodey_holding_new_paper",
  rhodey_heard: "rhodey_relieved",
  rhodey_listening: "rhodey_neutral",
  rhodey_loved: "rhodey_happy",
  rhodey_overwhelmed: "rhodey_crying",
  rhodey_partially_heard: "rhodey_questioning",
  rhodey_ready_to_repair: "rhodey_calm",
  rhodey_recovered_bandaged: "rhodey_bandaged",
  rhodey_refusing: "rhodey_frustrated",
  rhodey_refusing_share: "rhodey_angry",
  rhodey_remorseful: "rhodey_sad",
  rhodey_uncomfortable: "rhodey_questioning"
};

function visualAssetFor(rawAssetID) {
  const canonicalID = rawVisualMapping[rawAssetID];
  const asset = generalExpressions.get(canonicalID) ?? uniquePoses.get(canonicalID);
  if (!asset) throw new Error(`No canonical visual asset for ${rawAssetID}`);
  return asset;
}

function scene(characters, textBubble = null) {
  return { characters, textBubble };
}

function chapter(spec) {
  return spec;
}

const storySpecs = [
  chapter({
    story: 1,
    chapter: 1,
    id: "rhodey_wants_to_draw",
    title: localized("Make Rhodey Want to Draw", "Membuat Rhodey Mau Menggambar"),
    description: localized(
      "Rhodey is sitting in the classroom but does not feel ready to draw. He is close to the activity, yet his body language shows that he needs emotional safety before he can enjoy the drawing materials.",
      "Rhodey duduk di kelas tetapi belum merasa siap untuk menggambar. Ia dekat dengan aktivitasnya, tetapi bahasa tubuhnya menunjukkan bahwa ia butuh rasa aman sebelum bisa menikmati alat gambar."
    ),
    hints: [
      localized("A child may join an activity more easily after feeling noticed and accompanied.", "Anak sering lebih mudah ikut aktivitas setelah merasa diperhatikan dan ditemani.")
    ],
    background: backgrounds.classroom,
    characterNames: { rhodey: "Rhodey" },
    actions: [actions.approach, actions.crayon, actions.toy],
    gridCount: 3,
    initialState: "refusing",
    ideal: [[actions.approach.id], [actions.crayon.id]],
    successStates: ["drawing"],
    retryStates: ["frustrated", "distracted"],
    scenes: {
      refusing: scene(cast(["rhodey", expression("rhodey_refusing", "Rhodey turns away from the cardboard with closed posture and refuses to draw.")]), bubble("rhodey", "I don't want to draw right now.", "Aku belum mau menggambar sekarang.")),
      loved: scene(cast(["rhodey", expression("rhodey_loved", "Rhodey feels noticed and loved, with relaxed shoulders and a warm expression.")]), bubble("rhodey", "You're staying with me?", "Kamu menemaniku?")),
      uncomfortable: scene(cast(["rhodey", expression("rhodey_uncomfortable", "Rhodey receives the crayon too early and looks hesitant and uncomfortable.")]), bubble("rhodey", "I don't want the crayon yet.", "Aku belum mau menerima krayonnya.")),
      distracted: scene(cast(["rhodey", expression("rhodey_distracted", "Rhodey focuses on playing instead of the current activity.")]), bubble("rhodey", "I want to play instead.", "Aku mau bermain saja.")),
      comfortable: scene(cast(["rhodey", expression("rhodey_comfortable", "Rhodey is calm and comfortable but is not drawing yet.")]), null),
      drawing: scene(cast(["rhodey", expression("rhodey_drawing_happy", "Rhodey happily draws on the cardboard with a crayon.")]), bubble("rhodey", "I want to draw now!", "Sekarang aku mau menggambar!")),
      calming: scene(cast(["rhodey", expression("rhodey_calming", "Rhodey's breathing and posture begin to relax after support.")]), bubble("rhodey", "Thank you for staying with me.", "Terima kasih sudah menemaniku.")),
      frustrated: scene(cast(["rhodey", expression("rhodey_frustrated", "Rhodey is visibly frustrated by repeated pressure.")]), bubble("rhodey", "I said I don't want to draw!", "Aku bilang aku belum mau menggambar!")),
      curious: scene(cast(["rhodey", expression("rhodey_curious", "Rhodey looks curious about the crayon and considers trying it.")]), bubble("rhodey", "Can I try the crayon?", "Boleh aku mencoba krayonnya?"))
    },
    transition(state, selected) {
      const actionID = selected[0];
      const matrix = {
        refusing: { action_approach: "loved", action_crayon: "uncomfortable", action_toy: "distracted" },
        loved: { action_approach: "comfortable", action_crayon: "drawing", action_toy: "distracted" },
        uncomfortable: { action_approach: "calming", action_crayon: "frustrated", action_toy: "distracted" },
        distracted: { action_approach: "loved", action_crayon: "curious", action_toy: "distracted" }
      };
      return matrix[state]?.[actionID] ?? (actionID === actions.toy.id ? "distracted" : state);
    },
    mermaid: `flowchart LR
    A["Refusing"] -->|"Approach"| B["Feels noticed"]
    B -->|"Crayon"| C["Drawing - Success"]
    A -->|"Crayon too early"| D["Uncomfortable"]
    A -->|"Toy"| E["Distracted"]`
  }),
  chapter({
    story: 1,
    chapter: 2,
    id: "jojo_settles_down_to_draw",
    title: localized("Help Jojo Settle Down and Draw", "Bantu Jojo Tenang dan Menggambar"),
    description: localized(
      "Jojo is full of energy during drawing time and his noise makes it hard for Rhodey to focus. The scene is about helping Jojo shift from active play into a calmer classroom activity.",
      "Jojo sangat berenergi saat waktunya menggambar dan suaranya membuat Rhodey sulit fokus. Adegan ini tentang membantu Jojo berpindah dari bermain aktif ke aktivitas kelas yang lebih tenang."
    ),
    hints: [
      localized("Children often need attention before they can process an instruction.", "Anak sering perlu diarahkan perhatiannya sebelum bisa memproses instruksi.")
    ],
    background: backgrounds.classroom,
    characterNames: { jojo: "Jojo", rhodey: "Rhodey" },
    actions: [actions.askQuiet, actions.lecture, actions.attentionReset, actions.crayon],
    gridCount: 4,
    initialState: "noisy",
    ideal: [[actions.attentionReset.id], [actions.askQuiet.id], [actions.crayon.id]],
    successStates: ["drawing"],
    retryStates: ["upset", "resistant", "distracted"],
    scenes: {
      noisy: scene(cast(
        ["jojo", expression("jojo_noisy", "Jojo is loudly playing, leaning into Rhodey's space with energetic motion marks.")],
        ["rhodey", expression("rhodey_distracted", "Rhodey focuses away from the intended activity because of nearby noise.")]
      ), bubble("rhodey", "Jojo, I can't focus.", "Jojo, aku tidak bisa fokus.")),
      attentive: scene(cast(
        ["jojo", expression("jojo_attentive", "Jojo pauses and looks toward the caregiver after the attention reset.")],
        ["rhodey", expression("rhodey_attentive", "Rhodey looks up and notices that the room is becoming quieter.")]
      ), bubble("jojo", "Oh, are you talking to me?", "Oh, kamu bicara kepadaku?")),
      calm: scene(cast(
        ["jojo", expression("jojo_calm", "Jojo sits with relaxed posture and controlled energy.")],
        ["rhodey", expression("rhodey_comfortable", "Rhodey appears calm and comfortable beside Jojo.")]
      ), bubble("jojo", "Okay, I'll use a quiet voice.", "Baik, aku akan bicara pelan.")),
      drawing: scene(cast(
        ["jojo", expression("jojo_drawing_happy", "Jojo happily draws with a crayon while keeping a settled posture.")],
        ["rhodey", expression("rhodey_drawing_happy", "Rhodey happily draws beside Jojo with a crayon.")]
      ), bubble("jojo", "Let's draw together!", "Ayo menggambar bersama!")),
      resistant: scene(cast(
        ["jojo", expression("jojo_resistant", "Jojo crosses his arms and resists an instruction given before gaining his attention.")],
        ["rhodey", expression("rhodey_uncomfortable", "Rhodey looks uncomfortable while the noise continues.")]
      ), bubble("jojo", "Why should I be quiet?", "Kenapa aku harus diam?")),
      distracted: scene(cast(
        ["jojo", expression("jojo_distracted", "Jojo focuses on the item but not on the instruction or shared activity.")],
        ["rhodey", expression("rhodey_distracted", "Rhodey remains distracted from drawing.")]
      ), bubble("jojo", "Look at this instead!", "Lihat ini saja!")),
      upset: scene(cast(
        ["jojo", expression("jojo_upset", "Jojo looks hurt and defensive after being corrected too early.")],
        ["rhodey", expression("rhodey_uncomfortable", "Rhodey looks uncomfortable during the tense correction.")]
      ), bubble("jojo", "Don't yell at me!", "Jangan bentak aku!"))
    },
    transition(state, selected) {
      const actionID = selected[0];
      const matrix = {
        noisy: { action_attention_reset: "attentive", action_ask_quiet: "resistant", action_crayon: "distracted", action_lecture: "upset" },
        attentive: { action_attention_reset: "attentive", action_ask_quiet: "calm", action_crayon: "drawing", action_lecture: "upset" },
        calm: { action_attention_reset: "attentive", action_ask_quiet: "calm", action_crayon: "drawing", action_lecture: "upset" },
        resistant: { action_attention_reset: "attentive", action_ask_quiet: "resistant", action_crayon: "distracted", action_lecture: "upset" },
        distracted: { action_attention_reset: "attentive", action_ask_quiet: "resistant", action_crayon: "distracted", action_lecture: "upset" },
        upset: { action_attention_reset: "attentive", action_ask_quiet: "resistant", action_crayon: "distracted", action_lecture: "upset" },
        drawing: { action_attention_reset: "drawing", action_ask_quiet: "drawing", action_crayon: "drawing", action_lecture: "upset" }
      };
      return matrix[state][actionID];
    },
    mermaid: `flowchart LR
    A["Noisy and distracting"] -->|"Attention Reset"| B["Attentive"]
    B -->|"Ask to Be Quiet"| C["Calm"]
    C -->|"Crayon"| D["Drawing - Success"]
    A -->|"Lecture too early"| E["Upset - Retry"]
    A -->|"Crayon too early"| F["Distracted"]`
  }),
  chapter({
    story: 1,
    chapter: 3,
    id: "rhodey_torn_paper",
    title: localized("Help Rhodey After His Paper Tears", "Bantu Rhodey Setelah Kertasnya Robek"),
    description: localized(
      "Rhodey's drawing paper tears during class and the broken drawing feels important to him. He is upset not only because the paper is damaged, but because the work he cared about suddenly feels lost.",
      "Kertas gambar Rhodey robek saat di kelas dan gambar itu terasa penting baginya. Ia kesal bukan hanya karena kertasnya rusak, tetapi karena karya yang ia pedulikan terasa hilang tiba-tiba."
    ),
    hints: [
      localized("A distressed child may need calm presence before they can explain what happened.", "Anak yang sangat sedih mungkin butuh kehadiran tenang sebelum bisa menjelaskan yang terjadi.")
    ],
    background: backgrounds.classroom,
    characterNames: { rhodey: "Rhodey" },
    actions: [actions.approach, actions.asking, actions.candy, actions.paper],
    gridCount: 4,
    initialState: "crying",
    ideal: [[actions.approach.id], [actions.asking.id], [actions.paper.id]],
    successStates: ["relieved"],
    retryStates: ["frustrated", "distracted"],
    scenes: {
      crying: scene(cast(["rhodey", expression("rhodey_crying_torn_paper", "Rhodey cries while holding two torn pieces of his drawing paper.")]), bubble("rhodey", "My drawing is torn!", "Gambarku robek!")),
      calming: scene(cast(["rhodey", expression("rhodey_calming", "Rhodey's breathing and posture begin to relax after support.")]), bubble("rhodey", "Will you stay with me?", "Maukah kamu menemaniku?")),
      heard: scene(cast(["rhodey", expression("rhodey_heard", "Rhodey feels heard and points calmly to the torn paper while explaining.")]), bubble("rhodey", "It tore while I was drawing.", "Kertasnya robek saat aku menggambar.")),
      relieved: scene(cast(["rhodey", expression("rhodey_happy_new_paper", "Rhodey smiles with a clean replacement paper ready for drawing.")]), bubble("rhodey", "Thank you. I can try again!", "Terima kasih. Aku bisa mencoba lagi!")),
      overwhelmed: scene(cast(["rhodey", expression("rhodey_overwhelmed", "Rhodey is still crying and cannot answer a question yet.")]), bubble("rhodey", "I can't talk yet.", "Aku belum bisa bicara.")),
      uncomfortable: scene(cast(["rhodey", expression("rhodey_uncomfortable", "Rhodey looks hesitant because help arrived before he felt understood.")]), bubble("rhodey", "That's not my drawing.", "Itu bukan gambarku.")),
      distracted: scene(cast(["rhodey", expression("rhodey_distracted_candy", "Rhodey looks at the candy while still holding the torn drawing and remains emotionally unsettled.")]), bubble("rhodey", "The candy doesn't fix my drawing.", "Permennya tidak memperbaiki gambarku.")),
      curious: scene(cast(["rhodey", expression("rhodey_curious", "Rhodey looks curious about the offered material but is not fully ready.")]), bubble("rhodey", "Is that for me?", "Itu untukku?")),
      frustrated: scene(cast(["rhodey", expression("rhodey_frustrated", "Rhodey becomes frustrated when the response does not address what he needs.")]), bubble("rhodey", "Please listen to me!", "Tolong dengarkan aku!"))
    },
    transition(state, selected) {
      const actionID = selected[0];
      const matrix = {
        crying: { action_approach: "calming", action_asking: "overwhelmed", action_candy: "distracted", action_paper: "uncomfortable" },
        calming: { action_approach: "calming", action_asking: "heard", action_candy: "distracted", action_paper: "curious" },
        heard: { action_approach: "heard", action_asking: "heard", action_candy: "distracted", action_paper: "relieved" },
        overwhelmed: { action_approach: "calming", action_asking: "overwhelmed", action_candy: "distracted", action_paper: "uncomfortable" },
        uncomfortable: { action_approach: "calming", action_asking: "heard", action_candy: "distracted", action_paper: "frustrated" },
        distracted: { action_approach: "calming", action_asking: "overwhelmed", action_candy: "distracted", action_paper: "curious" },
        curious: { action_approach: "calming", action_asking: "heard", action_candy: "distracted", action_paper: "relieved" },
        frustrated: { action_approach: "calming", action_asking: "heard", action_candy: "distracted", action_paper: "frustrated" },
        relieved: { action_approach: "relieved", action_asking: "relieved", action_candy: "distracted", action_paper: "relieved" }
      };
      return matrix[state][actionID];
    },
    mermaid: `flowchart LR
    A["Crying with torn paper"] -->|"Approach"| B["Calming"]
    B -->|"Ask"| C["Feels heard"]
    C -->|"Paper"| D["Ready to try again - Success"]
    A -->|"Candy"| E["Distracted - Retry"]
    A -->|"Paper too early"| F["Uncomfortable"]`
  }),
  chapter({
    story: 2,
    chapter: 1,
    id: "validate_jojo_feelings",
    title: localized("Validate Jojo's Feelings", "Validasi Perasaan Jojo"),
    description: localized(
      "Jojo feels hurt in the playground after Rhodey says something unkind. The conflict is still small, but Jojo needs his feelings to be taken seriously before he can move on.",
      "Jojo merasa sakit hati di taman setelah Rhodey mengatakan sesuatu yang tidak baik. Konfliknya masih kecil, tetapi Jojo perlu merasa perasaannya dianggap serius sebelum bisa lanjut bermain."
    ),
    hints: [
      localized("Validation starts by making the child feel safe enough to speak.", "Validasi dimulai dari membuat anak merasa cukup aman untuk bicara.")
    ],
    background: backgrounds.playground,
    characterNames: { jojo: "Jojo", rhodey: "Rhodey" },
    actions: [actions.asking, actions.blaming, actions.approach],
    gridCount: 3,
    initialState: "hurt",
    ideal: [[actions.approach.id], [actions.asking.id]],
    successStates: ["validated"],
    retryStates: ["defensive"],
    scenes: {
      hurt: scene(cast(
        ["jojo", expression("jojo_hurt", "Jojo looks hurt and angry, with ears lowered after being called a name.")],
        ["rhodey", expression("rhodey_awkward", "Rhodey stands nearby with an awkward, uncertain expression.")]
      ), bubble("jojo", "Rhodey called me a mean name.", "Rhodey mengejekku.")),
      safe: scene(cast(
        ["jojo", expression("jojo_safe", "Jojo notices the calm approach and begins to feel safe enough to talk.")],
        ["rhodey", expression("rhodey_listening", "Rhodey watches quietly and begins listening.")]
      ), bubble("jojo", "Can I tell you what happened?", "Boleh aku ceritakan yang terjadi?")),
      heard: scene(cast(
        ["jojo", expression("jojo_heard", "Jojo explains his feelings and looks relieved that someone is listening.")],
        ["rhodey", expression("rhodey_listening", "Rhodey listens with softened posture.")]
      ), bubble("jojo", "That made me feel small.", "Itu membuatku merasa direndahkan.")),
      validated: scene(cast(
        ["jojo", expression("jojo_validated", "Jojo looks calm and emotionally validated after being heard.")],
        ["rhodey", expression("rhodey_remorseful", "Rhodey looks remorseful and understands that his words caused harm.")]
      ), bubble("jojo", "Thank you for listening to me.", "Terima kasih sudah mendengarkanku.")),
      defensive: scene(cast(
        ["jojo", expression("jojo_defensive", "Jojo folds his arms and becomes defensive after being blamed.")],
        ["rhodey", expression("rhodey_defensive", "Rhodey also becomes defensive during the blame.")]
      ), bubble("jojo", "Why are you blaming me?", "Kenapa kamu menyalahkanku?"))
    },
    transition(state, selected) {
      const actionID = selected[0];
      const matrix = {
        hurt: { action_approach: "safe", action_asking: "heard", action_blaming: "defensive" },
        safe: { action_approach: "safe", action_asking: "validated", action_blaming: "defensive" },
        heard: { action_approach: "validated", action_asking: "heard", action_blaming: "defensive" },
        defensive: { action_approach: "safe", action_asking: "heard", action_blaming: "defensive" },
        validated: { action_approach: "validated", action_asking: "validated", action_blaming: "defensive" }
      };
      return matrix[state][actionID];
    },
    mermaid: `flowchart LR
    A["Jojo feels hurt"] -->|"Approach"| B["Feels safe"]
    B -->|"Ask and listen"| C["Validated - Success"]
    A -->|"Ask first"| D["Heard"]
    D -->|"Approach"| C
    A -->|"Blame"| E["Defensive - Retry"]`
  }),
  chapter({
    story: 2,
    chapter: 2,
    id: "share_the_slide",
    title: localized("Help Rhodey Share the Slide", "Bantu Rhodey Berbagi Perosotan"),
    description: localized(
      "Rhodey blocks the slide and does not want Jojo to join. From the outside it looks like selfish behavior, but the reason may be fear, discomfort, or a misunderstanding about safety.",
      "Rhodey menghalangi perosotan dan tidak mau Jojo ikut bermain. Dari luar terlihat seperti egois, tetapi alasannya bisa berupa takut, tidak nyaman, atau salah paham tentang rasa aman."
    ),
    hints: [
      localized("Children can repair a conflict more naturally after the situation feels understood.", "Anak bisa memperbaiki konflik dengan lebih alami setelah situasinya terasa dipahami.")
    ],
    background: backgrounds.playground,
    characterNames: { jojo: "Jojo", rhodey: "Rhodey" },
    actions: [actions.asking, actions.toy, actions.approach, actions.apologize],
    gridCount: 4,
    initialState: "conflict",
    ideal: [[actions.asking.id], [actions.approach.id], [actions.apologize.id]],
    successStates: ["reconciled"],
    retryStates: ["distracted", "premature"],
    scenes: {
      conflict: scene(cast(
        ["jojo", expression("jojo_excluded", "Jojo stands away from the slide looking excluded and disappointed.")],
        ["rhodey", expression("rhodey_refusing_share", "Rhodey blocks the slide with guarded posture and refuses to share.")]
      ), bubble("rhodey", "I don't want Jojo on the slide.", "Aku tidak mau Jojo bermain di perosotan.")),
      understood: scene(cast(
        ["jojo", expression("jojo_listening", "Jojo listens without interrupting while Rhodey explains.")],
        ["rhodey", expression("rhodey_explaining", "Rhodey explains that he was worried the slide would not feel safe.")]
      ), bubble("rhodey", "I was worried we would bump into each other.", "Aku khawatir kami akan bertabrakan.")),
      safe: scene(cast(
        ["jojo", expression("jojo_safe", "Jojo responds to the calm approach and waits beside the slide.")],
        ["rhodey", expression("rhodey_calming", "Rhodey begins to relax during the calm approach.")]
      ), bubble("jojo", "We can take turns safely.", "Kami bisa bergantian dengan aman.")),
      ready: scene(cast(
        ["jojo", expression("jojo_ready_to_repair", "Jojo offers an open paw and is ready to repair the conflict.")],
        ["rhodey", expression("rhodey_ready_to_repair", "Rhodey opens his posture and is ready to repair the conflict.")]
      ), bubble("rhodey", "I understand. We can take turns.", "Aku mengerti. Kami bisa bergantian.")),
      reconciled: scene(cast(
        ["jojo", expression("jojo_handshake_happy", "Jojo smiles and extends a paw in a coordinated handshake pose.")],
        ["rhodey", expression("rhodey_handshake_happy", "Rhodey smiles and meets Jojo's paw in the matching handshake pose.")]
      ), bubble("jojo", "We're both sorry. Let's share!", "Kami berdua minta maaf. Ayo berbagi!")),
      premature: scene(cast(
        ["jojo", expression("jojo_awkward", "Jojo looks awkward because an apology was requested before either child felt understood.")],
        ["rhodey", expression("rhodey_awkward", "Rhodey looks awkward and unready to apologize.")]
      ), bubble("rhodey", "But you haven't listened yet.", "Tapi kamu belum mendengarkan.")),
      distracted: scene(cast(
        ["jojo", expression("jojo_distracted", "Jojo focuses on the toy instead of resolving the conflict.")],
        ["rhodey", expression("rhodey_distracted", "Rhodey focuses on the toy and avoids the sharing problem.")]
      ), bubble("jojo", "We forgot about the slide.", "Kami jadi melupakan perosotannya."))
    },
    transition(state, selected) {
      const actionID = selected[0];
      const matrix = {
        conflict: { action_asking: "understood", action_approach: "safe", action_apologize: "premature", action_toy: "distracted" },
        understood: { action_asking: "understood", action_approach: "ready", action_apologize: "premature", action_toy: "distracted" },
        safe: { action_asking: "ready", action_approach: "safe", action_apologize: "premature", action_toy: "distracted" },
        ready: { action_asking: "ready", action_approach: "ready", action_apologize: "reconciled", action_toy: "distracted" },
        premature: { action_asking: "understood", action_approach: "safe", action_apologize: "premature", action_toy: "distracted" },
        distracted: { action_asking: "understood", action_approach: "safe", action_apologize: "premature", action_toy: "distracted" },
        reconciled: { action_asking: "reconciled", action_approach: "reconciled", action_apologize: "reconciled", action_toy: "distracted" }
      };
      return matrix[state][actionID];
    },
    mermaid: `flowchart LR
    A["Rhodey refuses to share"] -->|"Ask"| B["Reason understood"]
    B -->|"Approach"| C["Ready to repair"]
    C -->|"Both apologize"| D["Share safely - Success"]
    A -->|"Toy"| E["Distracted - Retry"]
    A -->|"Apologize too early"| F["Not ready"]`
  }),
  chapter({
    story: 2,
    chapter: 3,
    id: "listen_before_helping_rhodey",
    title: localized("Listen Before Helping Rhodey", "Dengarkan Sebelum Membantu Rhodey"),
    description: localized(
      "Rhodey falls in the playground and says Jojo pushed him. Rhodey is hurt and crying, while Jojo looks shocked by the accusation. The scene asks the player to handle injury, emotion, and fairness at the same time.",
      "Rhodey jatuh di taman dan mengatakan Jojo mendorongnya. Rhodey terluka dan menangis, sementara Jojo terlihat terkejut karena dituduh. Adegan ini meminta pemain menangani luka, emosi, dan keadilan sekaligus."
    ),
    hints: [
      localized("When two children are involved, emotional safety and fairness need to move together.", "Saat ada dua anak terlibat, rasa aman emosional dan keadilan perlu berjalan bersama.")
    ],
    background: backgrounds.playground,
    characterNames: { jojo: "Jojo", rhodey: "Rhodey" },
    actions: [actions.asking, actions.blaming, actions.giveBandage, actions.lollipop, actions.approach],
    gridCount: 4,
    dualGridOrders: [1, 2],
    initialState: "accusation",
    ideal: [[actions.asking.id, actions.approach.id], [actions.approach.id, actions.asking.id], [actions.giveBandage.id]],
    successStates: ["recovered"],
    retryStates: ["defensive", "distracted"],
    scenes: {
      accusation: scene(cast(
        ["jojo", expression("jojo_worried_accused", "Jojo looks worried and surprised after being accused of pushing Rhodey.")],
        ["rhodey", expression("rhodey_crying_injured", "Rhodey sits on the ground crying with a small scrape on his knee.")]
      ), bubble("rhodey", "Jojo pushed me!", "Jojo mendorongku!")),
      factsKnown: scene(cast(
        ["jojo", expression("jojo_honest", "Jojo calmly explains what he saw with open, honest posture.")],
        ["rhodey", expression("rhodey_heard", "Rhodey feels heard while realizing that his fall was accidental.")]
      ), bubble("jojo", "Rhodey slipped. I was nearby, but I didn't push him.", "Rhodey terpeleset. Aku berada di dekatnya, tetapi aku tidak mendorongnya.")),
      partiallyHeard: scene(cast(
        ["jojo", expression("jojo_partially_heard", "Jojo has started explaining but still looks uncertain that both sides were heard.")],
        ["rhodey", expression("rhodey_partially_heard", "Rhodey is listening but still feels that the story is incomplete.")]
      ), bubble("jojo", "Please ask both of us.", "Tolong tanyakan kepada kami berdua.")),
      calmedUnknown: scene(cast(
        ["jojo", expression("jojo_worried", "Jojo is calmer but still worried because the cause has not been discussed.")],
        ["rhodey", expression("rhodey_calming", "Rhodey begins calming down but the misunderstanding is unresolved.")]
      ), bubble("rhodey", "I'm calmer, but what happened?", "Aku lebih tenang, tapi apa yang terjadi?")),
      calm: scene(cast(
        ["jojo", expression("jojo_relieved", "Jojo looks relieved after both children were heard and the approach stayed calm.")],
        ["rhodey", expression("rhodey_calm_injured", "Rhodey is calm and holds his scraped knee, ready for first aid.")]
      ), bubble("rhodey", "I understand. It was an accident.", "Aku mengerti. Itu kecelakaan.")),
      treated: scene(cast(
        ["jojo", expression("jojo_relieved", "Jojo looks relieved while Rhodey receives care.")],
        ["rhodey", expression("rhodey_bandaged", "Rhodey has a clean bandage on his knee and is no longer crying.")]
      ), bubble("rhodey", "My knee feels better.", "Lututku terasa lebih baik.")),
      treatedEarly: scene(cast(
        ["jojo", expression("jojo_worried", "Jojo remains worried because care was given before the misunderstanding was resolved.")],
        ["rhodey", expression("rhodey_bandaged_uncertain", "Rhodey has a bandage but still looks emotionally uncertain.")]
      ), bubble("rhodey", "My knee is treated, but please listen to us.", "Lututku sudah diobati, tapi tolong dengarkan kami.")),
      recovered: scene(cast(
        ["jojo", expression("jojo_relieved", "Jojo smiles with relaxed posture after the misunderstanding is resolved.")],
        ["rhodey", expression("rhodey_recovered_bandaged", "Rhodey stands comfortably with a bandaged knee and a relieved smile.")]
      ), bubble("rhodey", "I'm okay now. Thank you for listening first.", "Aku baik-baik saja sekarang. Terima kasih sudah mendengarkan terlebih dahulu.")),
      defensive: scene(cast(
        ["jojo", expression("jojo_defensive", "Jojo becomes defensive when blamed before being asked what happened.")],
        ["rhodey", expression("rhodey_defensive", "Rhodey becomes tense as the accusation escalates.")]
      ), bubble("jojo", "You didn't even ask me!", "Kamu bahkan belum bertanya kepadaku!")),
      distracted: scene(cast(
        ["jojo", expression("jojo_distracted", "Jojo focuses on the lollipop instead of explaining the accident.")],
        ["rhodey", expression("rhodey_distracted_candy", "Rhodey focuses on the sweet while his injury and feelings remain unresolved.")]
      ), bubble("rhodey", "The lollipop doesn't explain what happened.", "Lolipopnya tidak menjelaskan yang terjadi."))
    },
    transition(state, selected, stepIndex) {
      if (stepIndex === 0) {
        const [jojoAction, rhodeyAction] = selected;
        const pair = new Set(selected);
        if (jojoAction === actions.asking.id && rhodeyAction === actions.approach.id) return "partiallyHeard";
        if (jojoAction === actions.asking.id && rhodeyAction === actions.asking.id) return "factsKnown";
        if (pair.has(actions.blaming.id)) return "defensive";
        if (pair.has(actions.lollipop.id)) return "distracted";
        if (jojoAction === actions.approach.id && rhodeyAction === actions.approach.id) return "calmedUnknown";
        if (pair.has(actions.giveBandage.id)) return "treatedEarly";
        return "partiallyHeard";
      }

      const matrix = {
        factsKnown: { action_asking: "factsKnown", action_blaming: "defensive", action_give_bandage: "treated", action_lollipop: "distracted", action_approach: "calm" },
        partiallyHeard: { action_asking: "factsKnown", action_blaming: "defensive", action_give_bandage: "treatedEarly", action_lollipop: "distracted", action_approach: "calmedUnknown" },
        calmedUnknown: { action_asking: "factsKnown", action_blaming: "defensive", action_give_bandage: "treatedEarly", action_lollipop: "distracted", action_approach: "calmedUnknown" },
        calm: { action_asking: "factsKnown", action_blaming: "defensive", action_give_bandage: "recovered", action_lollipop: "distracted", action_approach: "calm" },
        treated: { action_asking: "factsKnown", action_blaming: "defensive", action_give_bandage: "treated", action_lollipop: "distracted", action_approach: "recovered" },
        treatedEarly: { action_asking: "factsKnown", action_blaming: "defensive", action_give_bandage: "treated", action_lollipop: "distracted", action_approach: "recovered" },
        defensive: { action_asking: "partiallyHeard", action_blaming: "defensive", action_give_bandage: "treatedEarly", action_lollipop: "distracted", action_approach: "calmedUnknown" },
        distracted: { action_asking: "partiallyHeard", action_blaming: "defensive", action_give_bandage: "treatedEarly", action_lollipop: "distracted", action_approach: "calmedUnknown" },
        recovered: { action_asking: "recovered", action_blaming: "defensive", action_give_bandage: "recovered", action_lollipop: "distracted", action_approach: "recovered" }
      };
      const actionID = selected.length === 1
        ? selected[0]
        : (() => {
            const [jojoAction, rhodeyAction] = selected;
            const pair = new Set(selected);
            if (jojoAction === actions.approach.id && rhodeyAction === actions.asking.id) return "ideal_followup";
            if (pair.has(actions.blaming.id)) return actions.blaming.id;
            if (pair.has(actions.lollipop.id)) return actions.lollipop.id;
            if (selected.every(id => id === actions.approach.id)) return actions.approach.id;
            if (pair.has(actions.giveBandage.id)) return actions.giveBandage.id;
            if (pair.has(actions.approach.id)) return actions.approach.id;
            return actions.asking.id;
          })();
      return actionID === "ideal_followup" ? "calm" : matrix[state][actionID];
    },
    mermaid: `flowchart LR
    A["Grid 1: Rhodey is hurt; Jojo is accused"] -->|"Ask Jojo + Approach Rhodey"| B["Jojo explains; Rhodey calms"]
    B -->|"Approach Jojo + Ask Rhodey on Grid 2"| C["Rhodey is calm"]
    C -->|"Give Bandage on Grid 3"| D["Recovered - Success"]
    A -->|"Any Blame"| E["Defensive - Retry"]
    A -->|"Any Lollipop"| F["Distracted - Retry"]`
  })
];

function slugFor(spec) {
  return `story-${spec.story}-chapter-${spec.chapter}`;
}

function filenameFor(spec, extension) {
  return `story ${spec.story} chapter ${spec.chapter}.${extension}`;
}

function product(groups) {
  return groups.reduce(
    (combinations, group) => combinations.flatMap(combination => group.map(value => [...combination, value])),
    [[]]
  );
}

function placementOptions(grid, chapterActions) {
  const actionIDs = chapterActions.map(action => action.id);
  const selections = product(grid.dropSlots.map(() => actionIDs));
  return selections.map(selection => grid.dropSlots.map((slot, index) => ({
    slotID: slot.id,
    actionID: selection[index]
  })));
}

function isIdeal(steps, ideal) {
  return steps.every((step, index) => {
    const actual = step.placements.map(placement => placement.actionID);
    return actual.length === ideal[index].length && actual.every((actionID, actionIndex) => actionID === ideal[index][actionIndex]);
  });
}

function stateOutput(gridID, sceneDefinition) {
  const rawAssetIDs = sceneDefinition.characters.map(character => character.asset.id);
  const isHandshake = rawAssetIDs.includes("jojo_handshake_happy") && rawAssetIDs.includes("rhodey_handshake_happy");
  const visualSlots = isHandshake
    ? [{
        slot: 1,
        characterIDs: ["jojo", "rhodey"],
        assetID: "jojo_rhodey_handshake",
        assetType: "pose"
      }]
    : sceneDefinition.characters.map((character, index) => {
        const asset = visualAssetFor(character.asset.id);
        return {
          slot: index + 1,
          characterIDs: [character.characterID],
          assetID: asset.id,
          assetType: asset.type
        };
      });

  return {
    gridID,
    visualSlots,
    textBubble: sceneDefinition.textBubble
  };
}

function buildStory(spec) {
  const dualGridOrders = new Set(spec.dualGridOrders ?? (spec.dualFirstGrid ? [1] : []));
  const grids = Array.from({ length: spec.gridCount }, (_, index) => {
    const isFinal = index === spec.gridCount - 1;
    const dropSlots = isFinal
      ? []
      : dualGridOrders.has(index + 1)
        ? [
            { id: "slot_jojo", targetCharacterID: "jojo" },
            { id: "slot_rhodey", targetCharacterID: "rhodey" }
          ]
        : [{ id: "slot_scene", targetCharacterID: null }];
    return {
      id: `grid_${index + 1}`,
      order: index + 1,
      locked: isFinal,
      backgroundID: spec.background.id,
      dropSlots
    };
  });

  const interactiveGrids = grids.slice(0, -1);
  const stepOptions = interactiveGrids.map(grid => placementOptions(grid, spec.actions));
  const stepCombinations = product(stepOptions);
  const outcomes = stepCombinations.map(placementsByStep => {
    const steps = placementsByStep.map((placements, index) => ({
      sourceGridID: interactiveGrids[index].id,
      placements
    }));
    const stateNames = [spec.initialState];
    let currentState = spec.initialState;
    for (const [stepIndex, step] of steps.entries()) {
      currentState = spec.transition(currentState, step.placements.map(placement => placement.actionID), stepIndex);
      stateNames.push(currentState);
    }
    const finalState = stateNames.at(-1);
    return {
      steps,
      states: stateNames.map((stateName, index) => stateOutput(grids[index].id, spec.scenes[stateName])),
      finalState: finalState.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase(),
      isIdeal: isIdeal(steps, spec.ideal),
      category: spec.successStates.includes(finalState)
        ? "success"
        : spec.retryStates.includes(finalState)
          ? "retry"
          : "progress"
    };
  });

  const expressionIDsByCharacter = new Map(Object.keys(spec.characterNames).map(characterID => [characterID, new Set()]));
  for (const sceneDefinition of Object.values(spec.scenes)) {
    for (const character of sceneDefinition.characters) {
      const asset = visualAssetFor(character.asset.id);
      if (asset.type === "expression") expressionIDsByCharacter.get(character.characterID).add(asset.id);
    }
  }

  return {
    schemaVersion: 4,
    id: spec.id,
    title: spec.title,
    description: spec.description,
    hints: spec.hints,
    initialState: spec.initialState.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase(),
    gridCount: spec.gridCount,
    choiceCount: grids.reduce((sum, grid) => sum + grid.dropSlots.length, 0),
    actions: spec.actions.map(({ id, name }) => ({ id, name })),
    characters: Object.entries(spec.characterNames).map(([id, displayName]) => ({
      id,
      displayName,
      expressionIDs: [...expressionIDsByCharacter.get(id)].sort()
    })),
    grids,
    outcomes
  };
}

function markdownFor(spec, story) {
  const actionList = spec.actions.map(action => `- ${action.name.en} / ${action.name.id}`).join("\n");
  const hintList = spec.hints.map(hint => `- ${hint.en}`).join("\n");
  const usedVisualIDs = new Set(story.outcomes.flatMap(outcome => outcome.states.flatMap(state => state.visualSlots.map(slot => slot.assetID))));
  const expressionAssets = [...usedVisualIDs].map(id => generalExpressions.get(id)).filter(Boolean).sort((left, right) => left.id.localeCompare(right.id));
  const poseAssets = [...usedVisualIDs].map(id => uniquePoses.get(id)).filter(Boolean).sort((left, right) => left.id.localeCompare(right.id));
  const expressionRows = expressionAssets.map(asset => `| \`${asset.id}\` | ${asset.direction} |`).join("\n");
  const poseRows = poseAssets.map(asset => `| \`${asset.id}\` | ${asset.direction} |`).join("\n");
  const actionRows = spec.actions.map(action => `| \`${action.id}\` | ${action.direction} |`).join("\n");
  const characterNames = Object.values(spec.characterNames).join(", ");
  const possibilityFactors = Array(story.choiceCount).fill(story.actions.length).join(" × ");
  const gridRows = story.grids.map((grid, index) => {
    if (!grid.dropSlots.length) {
      return `| Grid ${grid.order} | Result | 0 | None | Shows the final result; no action can be dropped. |`;
    }

    const targetedCharacters = grid.dropSlots
      .map(slot => slot.targetCharacterID)
      .filter(Boolean)
      .map(characterID => spec.characterNames[characterID]);
    const target = targetedCharacters.length
      ? `${targetedCharacters.join(" + ")} (one targeted slot each)`
      : "Scene (general slot)";
    const nextGrid = `Grid ${index + 2}`;
    const completion = grid.dropSlots.length > 1
      ? `Both slots must be filled before ${nextGrid} appears.`
      : `One action completes this grid and reveals ${nextGrid}.`;
    return `| Grid ${grid.order} | Interactive | ${grid.dropSlots.length} | ${target} | ${completion} |`;
  }).join("\n");

  return `## Chapter ${spec.chapter}: ${spec.title.en}

> **Overview**
>
> Character${Object.keys(spec.characterNames).length > 1 ? "s" : ""}: ${characterNames}  
> Grid: ${spec.gridCount}  
> Choice Slots: ${story.choiceCount}  
> Actions: ${story.actions.length}  
> Possibilities: ${story.outcomes.length}

### Description

${spec.description.en}

### Hints

${hintList}

### Grid & Choice Slot Breakdown

A **grid** is one story frame. The grid count includes the final result frame. A **choice slot** is one place where the player must drop an action; one interactive grid may contain more than one slot.

| Grid | Role | Choice Slots | Slot Target | Completion Rule |
| --- | --- | ---: | --- | --- |
${gridRows}

**Possibility formula:** ${possibilityFactors} = ${story.outcomes.length} outcomes (${story.actions.length} actions across ${story.choiceCount} slots). Every slot accepts any chapter action, and actions may be repeated in later slots.

### Actions

${actionList}

### Developer Mermaid

\`\`\`mermaid
${spec.mermaid}
\`\`\`

### Artist Drawing List

**General Character Expressions: ${expressionAssets.length} drawings**

| Asset ID | Visual Direction |
| --- | --- |
${expressionRows}

**Unique Scene Poses: ${poseAssets.length} drawings**

| Asset ID | Visual Direction |
| --- | --- |
${poseRows || "| — | No unique pose required in this chapter. |"}

**Actions: ${spec.actions.length} drawings**

| Asset ID | Visual Direction |
| --- | --- |
${actionRows}

**Backgrounds: 1 drawing**

| Asset ID | Used In | Visual Direction |
| --- | --- | --- |
| \`${spec.background.id}\` | Grid 1–${spec.gridCount} | ${spec.background.direction} |
`;
}

function collectAssets(stories) {
  const assetsByID = new Map();
  const use = (asset, type, slug) => {
    if (!assetsByID.has(asset.id)) {
      assetsByID.set(asset.id, {
        id: asset.id,
        type,
        visualDirection: asset.direction,
        usedIn: new Set()
      });
    }
    if (slug) assetsByID.get(asset.id).usedIn.add(slug);
  };

  for (const { spec } of stories) {
    const slug = slugFor(spec);
    for (const action of spec.actions) use(action, "action", slug);
    use(spec.background, "background", slug);
    for (const sceneDefinition of Object.values(spec.scenes)) {
      for (const character of sceneDefinition.characters) {
        const asset = visualAssetFor(character.asset.id);
        use(asset, asset.type, slug);
      }
    }
  }

  return [...assetsByID.values()]
    .map(asset => ({
      ...asset,
      usedIn: [...asset.usedIn].sort(),
      reuseCount: asset.usedIn.size
    }))
    .sort((left, right) => left.type.localeCompare(right.type) || left.id.localeCompare(right.id));
}

function artistMarkdown(assets) {
  const expressionCount = assets.filter(asset => asset.type === "expression").length;
  const poseCount = assets.filter(asset => asset.type === "pose").length;
  const sections = [
    ["Actions", "action"],
    ["General Character Expressions", "expression"],
    ["Unique Scene Poses", "pose"],
    ["Backgrounds", "background"]
  ].map(([title, type]) => {
    const matching = assets.filter(asset => asset.type === type);
    const rows = matching.map(asset => `| \`${asset.id}\` | ${asset.reuseCount} | ${asset.usedIn.join(", ")} | ${asset.visualDirection} |`).join("\n");
    return `## ${title} (${matching.length} unique drawings)

| Asset ID | Reuse Count | Used In | Visual Direction |
| --- | ---: | --- | --- |
${rows}`;
  }).join("\n\n");

  return `# Artist Assets

This catalog is the source of truth for drawings shared across all six chapters. Reuse an asset only when its emotion, pose, included objects, and viewing angle match.

The character workload is intentionally limited to **${expressionCount} general expressions** and **${poseCount} unique scene poses**. Important objects such as crayons, paper, scrapes, and bandages are baked into the unique poses, so the app does not need prop positioning or overlay logic.

${sections}
`;
}

const generatedStories = storySpecs.map(spec => ({ spec, story: buildStory(spec) }));
const assets = collectAssets(generatedStories);
const manifest = generatedStories.map(({ spec }) => ({
  type: "chapter",
  story: spec.story,
  chapter: spec.chapter,
  slug: slugFor(spec),
  title: spec.title.en,
  markdown: filenameFor(spec, "md"),
  json: filenameFor(spec, "json")
}));
manifest.push({
  type: "assets",
  slug: "artist-assets",
  title: "Artist Assets",
  markdown: "artist assets.md",
  json: "artist assets.json"
});
manifest.push({
  type: "tech",
  slug: "tech",
  title: "Technical Guide",
  markdown: "tech.md"
});

for (const { spec, story } of generatedStories) {
  await writeFile(filenameFor(spec, "json"), `${JSON.stringify(story, null, 2)}\n`);
  await writeFile(filenameFor(spec, "md"), markdownFor(spec, story));
}

await writeFile("artist assets.json", `${JSON.stringify({ schemaVersion: 1, assets }, null, 2)}\n`);
await writeFile("artist assets.md", artistMarkdown(assets));
await writeFile("chapters.json", `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`generated ${generatedStories.length} chapters, ${assets.length} unique assets, and ${generatedStories.reduce((sum, entry) => sum + entry.story.outcomes.length, 0)} outcomes`);
