import json
import re

def parse_quizzes(md_file_path):
    with open(md_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    quizzes = {}
    current_topic = None
    current_question = None
    
    for i in range(len(lines)):
        line = lines[i].strip()
        if not line:
            continue
            
        # Match Topic or Final Exam
        topic_match = re.search(r'\*\*Topic \d+: (.*?)\*\*', line, re.IGNORECASE)
        final_exam_match = re.search(r'\*\*COMPREHENSIVE FINAL EXAM\*\*', line, re.IGNORECASE)
        
        if topic_match:
            current_topic = topic_match.group(1).title()
            quizzes[current_topic] = []
            continue
        elif final_exam_match:
            current_topic = "Final Exam"
            quizzes[current_topic] = []
            continue
            
        if current_topic is None:
            continue
            
        # Match Question
        q_match = re.search(r'### \*\*Q\d+: (.*?)\*\*', line)
        if q_match:
            current_question = {
                "question": q_match.group(1),
                "options": [],
                "correct_answers": [],
                "explanations": []
            }
            quizzes[current_topic].append(current_question)
            continue
            
        if current_question is None:
            continue
            
        # Match Option
        # matches "- **A)** Text" or "**A)** Text"
        opt_match = re.search(r'^(?:-\s*)?\*\*(.*?)\)\*\*\s*(.*)$', line)
        if opt_match:
            opt_letter = opt_match.group(1).strip()
            opt_text = opt_match.group(2).strip()
            current_question["options"].append({"id": opt_letter, "text": opt_text})
            continue
            
        # Match Correct Answer
        ans_match = re.search(r'\*\*Correct Answer\(s\):\*\*\s*(.*)', line)
        if ans_match:
            answers = ans_match.group(1).replace(' ', '').split(',')
            current_question["correct_answers"] = answers
            continue
            
        # Match Explanation
        exp_match = re.search(r'-\s*\*\*Option (.*?)\*\*\s*:\s*(.*)', line)
        if exp_match:
            opt_letter = exp_match.group(1).strip()
            exp_text = exp_match.group(2).strip()
            current_question["explanations"].append({"option": opt_letter, "reason": exp_text})
            continue

    return quizzes

def integrate_quizzes(json_path, quizzes):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Find the target course
    course = next(c for c in data if c.get('subject_code') == 'TIU-PC-UCS-T22101')
    
    # Map topics to quizzes
    topic_mapping = {
        "Evolution Of Computer Architectures": "Evolution of Computer Architectures",
        "Von Neumann And Harvard Models": "Von Neumann and Harvard Models",
        "Memory Hierarchy And Characteristics": "Memory Hierarchy and Characteristics",
        "Cache Memory And Performance": "Cache Memory and Performance",
        "Virtual Memory And Address Translation": "Virtual Memory and Address Translation",
        "Instruction Set Architectures (Cisc Vs. Risc)": "Instruction Set Architectures (CISC vs. RISC)",
        "Pipelining And Instruction-Level Parallelism": "Pipelining and Instruction-Level Parallelism"
    }
    
    for md_topic, questions in quizzes.items():
        if md_topic == "Final Exam":
            course['modules'][0]['module_quiz'] = questions
            print(f"Added {len(questions)} questions to Final Exam")
            continue
            
        json_topic = topic_mapping.get(md_topic)
        if json_topic and json_topic in course['topicDetails']:
            course['topicDetails'][json_topic]['quiz'] = questions
            print(f"Added {len(questions)} questions to topic: {json_topic}")
        else:
            print(f"Warning: Topic not found in JSON: {md_topic}")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    quizzes = parse_quizzes("Computer_Architecture_Quizzes_Fixed.md")
    integrate_quizzes("public/data/real_courses_data.json", quizzes)
    print("Quizzes successfully integrated!")
