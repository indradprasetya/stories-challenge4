
## Chapter 1: Make Rhodey Want to Draw

| Character | Personality | Gender |
| --------- | ----------- | ------ |
| Jojo      | Hyperactive | M      |
| Rhodey    | Tantrum     | M      |
| Timmy     | Shy         | F      |

> **Overview**
>
> Character: Rhodey  
> Grid: 3  
> Choice Grid: 2  
> Actions:
> - Get Nearby
> - Crayon
> - Toy

**Synopsis**: Rhodey is playing near a piece of cardboard and does not want to draw. The player needs to get nearby first so Rhodey feels noticed and loved, then give him a crayon.

```mermaid
flowchart LR
    START["Grid 1 - Initial<br/>rhodey_refusing<br/>EN: I don't want to draw right now.<br/>ID: Aku belum mau menggambar sekarang."]

    START -->|Get Nearby / Mendekat| NEAR["Grid 2<br/>rhodey_loved<br/>EN: You're staying with me?<br/>ID: Kamu menemaniku?"]
    START -->|Crayon / Krayon| CRAYON["Grid 2<br/>rhodey_uncomfortable<br/>EN: I don't want the crayon yet.<br/>ID: Aku belum mau menerima krayonnya."]
    START -->|Toy / Mainan| TOY["Grid 2<br/>rhodey_distracted<br/>EN: I want to play instead.<br/>ID: Aku mau bermain saja."]

    NEAR -->|Get Nearby / Mendekat| N_N["Grid 3<br/>rhodey_comfortable<br/>No text bubble<br/>PROGRESS"]
    NEAR -->|Crayon / Krayon| N_C["Grid 3<br/>rhodey_drawing_happy<br/>EN: I want to draw now!<br/>ID: Sekarang aku mau menggambar!<br/>SUCCESS - IDEAL"]
    NEAR -->|Toy / Mainan| N_T["Grid 3<br/>rhodey_distracted<br/>EN: Let's play instead!<br/>ID: Kita bermain saja!<br/>RETRY"]

    CRAYON -->|Get Nearby / Mendekat| C_N["Grid 3<br/>rhodey_calming<br/>EN: Thank you for staying with me.<br/>ID: Terima kasih sudah menemaniku.<br/>PROGRESS"]
    CRAYON -->|Crayon / Krayon| C_C["Grid 3<br/>rhodey_frustrated<br/>EN: I said I don't want to draw!<br/>ID: Aku bilang aku belum mau menggambar!<br/>RETRY"]
    CRAYON -->|Toy / Mainan| C_T["Grid 3<br/>rhodey_distracted<br/>No text bubble<br/>RETRY"]

    TOY -->|Get Nearby / Mendekat| T_N["Grid 3<br/>rhodey_loved<br/>EN: Stay and play with me.<br/>ID: Temani aku bermain.<br/>PROGRESS"]
    TOY -->|Crayon / Krayon| T_C["Grid 3<br/>rhodey_curious<br/>EN: Can I try the crayon?<br/>ID: Boleh aku mencoba krayonnya?<br/>PROGRESS"]
    TOY -->|Toy / Mainan| T_T["Grid 3<br/>rhodey_distracted<br/>No text bubble<br/>RETRY"]

    classDef initial fill:#1E293B,stroke:#64748B,color:#F8FAFC
    classDef progress fill:#422006,stroke:#D97706,color:#FEF3C7
    classDef success fill:#052E16,stroke:#16A34A,color:#DCFCE7
    classDef retry fill:#450A0A,stroke:#DC2626,color:#FEE2E2

    class START initial
    class NEAR,CRAYON,TOY,N_N,C_N,T_N,T_C progress
    class N_C success
    class N_T,C_C,C_T,T_T retry
```

### Artist Drawing List

**Rhodey Expressions: 9 drawings**

| Asset ID | Visual Direction |
| --- | --- |
| `rhodey_refusing` | Refuses to draw; closed posture and turns away from the cardboard |
| `rhodey_loved` | Feels noticed and loved; relaxed posture and warm expression |
| `rhodey_uncomfortable` | Receives the crayon too early; hesitant and uncomfortable |
| `rhodey_distracted` | Focuses on playing instead of drawing |
| `rhodey_comfortable` | Calm and comfortable, but not drawing yet |
| `rhodey_drawing_happy` | Happily draws on the cardboard with a crayon |
| `rhodey_calming` | Starts calming down after being approached |
| `rhodey_frustrated` | Frustrated because the crayon is offered repeatedly |
| `rhodey_curious` | Curious about the crayon and considers trying it |

**Actions: 3 drawings**

| Asset ID            | Visual Direction                                         |
| ------------------- | -------------------------------------------------------- |
| `action_get_nearby` | A friendly figure moving closer or sitting beside Rhodey |
| `action_crayon`     | One clearly recognizable drawing crayon                  |
| `action_toy`        | Rhodey's simple, recognizable favorite toy               |

**Backgrounds: 1 drawing**

| Asset ID | Used In | Visual Direction |
| --- | --- | --- |
| `background_classroom` | Grid 1, Grid 2, Grid 3 | A classroom interior with a clear central area for Rhodey, the cardboard, and text bubbles |
