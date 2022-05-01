export let SettlementNoteTemplate: string = `
---
name: {{ name }}
type: {{ type }}
---

# Secret

{{ secret }}

# NPCs

{% for npc in npcs %}

## {{ npc.formattedData.name }} ({{ npc.formattedData.race }}, {{ npc.formattedData.gender }})

### Traits

{% for trait in npc.traits %}
- {{ trait }}
{% endfor %}

### Desires

{% for desire in npc.desires %}
- {{ desire }}
{% endfor %} 

{% endfor %}

`.trim();

export let SettlementTemplate: string = `
# {{ type }}: {{ name }}

## Secret

{{ secret }}

## NPCs

{% for npc in npcs %}

### {{ npc.formattedData.name }} ({{ npc.formattedData.race }}, {{ npc.formattedData.gender }})

#### Traits

{% for trait in npc.traits %}
- {{ trait }}
{% endfor %}

#### Desires

{% for desire in npc.desires %}
- {{ desire }}
{% endfor %} 

{% endfor %}

`.trim();

export let NPCNoteTemplate: string = `
---
race: {{ race }}
gender: {{ gender }}
---

{{ race }}, {{ gender }}

# Traits

{% for trait in traits %}
- {{ trait }}
{% endfor %}

# Desires

{% for trait in traits %}
- {{ trait }}
{% endfor %}

`.trim();

export let NPCTemplate: string = `# {{ name }}

- {{ race }}, {{ gender }}

## Traits

{% for trait in traits %}
- {{ trait }}
{% endfor %}

## Desires

{% for trait in traits %}
- {{ trait }}
{% endfor %}

`.trim();
