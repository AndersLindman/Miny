// Miny - AIR-canonical zkVM trace generator


const MOD = 2 ** 31 - 1;

// -------------------------
// Opcode encoding (AIR-friendly)
// -------------------------
const OPCODE = {
    CONST: 0,
    SET: 1,
    ADD: 2,
    SUB: 3,
    MUL: 4,
    SQR: 5,
    INC: 6,
    DEC: 7,
    GET: 8,
    SELECT: 9,
    PUSH: 10,
    POP: 11,
    DUP: 12,
    SWAP: 13,
    JMP: 14,
    COND: 15,
    JSR: 16,
    RET: 17,
    HALT: 18
};

const OPCODE_COUNT = 19;

// -------------------------
// Field helpers
// -------------------------
function mod(x) {
    x %= MOD;
    return x < 0 ? x + MOD : x;
}

function add(a, b) {
    return mod(a + b);
}

function sub(a, b) {
    return mod(a - b);
}

// -------------------------
// Stack
// -------------------------
const MAX_STACK = 1024;
const STACK = new Uint32Array(MAX_STACK);

// -------------------------
// Parse
// -------------------------
function parse(code) {
    return code
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("//"))
        .map(line => {
            const [op, argRaw] = line.split(/\s+/);
            return { op, arg: argRaw ? Number(argRaw) : 0 };
        });
}

// -------------------------
// VM → AIR trace
// -------------------------
function run(rom) {

    let pc = 0;
    let sp = 0;
    let acc = 0;

    let regA = 0;
    let regB = 0;
    let regC = 0;

    const trace = [];

    while (pc < rom.length) {
        const ins = rom[pc];

        // -------------------------
        // PRE STATE
        // -------------------------
        const PC = pc;
        const SP = sp;
        const ACC = acc;

        const REG_A = regA;
        const REG_B = regB;
        const REG_C = regC;

        const STACK_TOP = sp > 0 ? STACK[sp - 1] : 0;

        const OPCODE_ID = OPCODE[ins.op];
        const ARG = ins.arg;

        // one-hot opcode selectors (AIR-ready)
        const OP = new Array(OPCODE_COUNT).fill(0);
        OP[OPCODE_ID] = 1;

        // -------------------------
        // NEXT STATE
        // -------------------------
        let nextPC = pc;
        let nextSP = sp;
        let nextACC = acc;

        let nextA = regA;
        let nextB = regB;
        let nextC = regC;

        switch (ins.op) {

            case "CONST":
                nextACC = mod(ins.arg);
                nextPC++;
                break;

            case "SET":
                if (ins.arg === 0) nextA = acc;
                if (ins.arg === 1) nextB = acc;
                if (ins.arg === 2) nextC = acc;
                nextPC++;
                break;

            case "ADD":
                nextACC = add(acc, [regA, regB, regC][ins.arg]);
                nextPC++;
                break;

            case "SUB":
                nextACC = sub(acc, [regA, regB, regC][ins.arg]);
                nextPC++;
                break;

            case "MUL": {
                const r = BigInt(acc) * BigInt([regA, regB, regC][ins.arg]);
                let reduced = (r & BigInt(MOD)) + (r >> 31n);
                if (reduced >= BigInt(MOD)) reduced -= BigInt(MOD);
                nextACC = Number(reduced);
                nextPC++;
                break;
            }

            case "SQR": {
                const r = BigInt(acc) * BigInt(acc);
                let reduced = (r & BigInt(MOD)) + (r >> 31n);
                if (reduced >= BigInt(MOD)) reduced -= BigInt(MOD);
                nextACC = Number(reduced);
                nextPC++;
                break;
            }

            case "INC":
                nextACC = add(acc, 1);
                nextPC++;
                break;

            case "DEC":
                nextACC = sub(acc, 1);
                nextPC++;
                break;

            case "GET":
                nextACC = [regA, regB, regC][ins.arg];
                nextPC++;
                break;

            case "SELECT":
                if (acc !== 0 && acc !== 1) {
                    throw new Error("SELECT requires binary selector");
                }
                nextACC = acc === 0 ? regA : regB;
                nextPC++;
                break;

            case "PUSH":
                if (sp >= MAX_STACK) throw new Error("Stack overflow");
                STACK[sp] = mod(acc);
                nextSP++;
                nextPC++;
                break;

            case "POP":
                if (sp === 0) throw new Error("Stack underflow");
                nextSP = sp - 1;
                nextACC = STACK[nextSP];
                nextPC++;
                break;

            case "DUP":
                if (sp === 0) throw new Error("Stack underflow");
                if (sp >= MAX_STACK) throw new Error("Stack overflow");
                STACK[sp] = STACK[sp - 1];
                nextSP++;
                nextPC++;
                break;

            case "SWAP":
                if (sp === 0) throw new Error("Stack underflow");
            {
                const tmp = acc;
                nextACC = STACK[sp - 1];
                STACK[sp - 1] = tmp;
            }
                nextPC++;
                break;

            case "JMP":
                nextPC = ins.arg;
                break;

            case "COND":
                nextPC = acc === 0 ? ins.arg : pc + 1;
                break;

            case "JSR":
                nextPC = acc;
                break;

            case "RET":
                if (sp === 0) throw new Error("Stack underflow");
                nextSP = sp - 1;
                nextPC = STACK[nextSP];
                break;

            case "HALT":
                return { trace, acc: nextACC, regs: { regA, regB, regC } };
        }

        // -------------------------
        // POST STATE
        // -------------------------
        const STACK_TOP_NEXT = nextSP > 0 ? STACK[nextSP - 1] : 0;

        trace.push({
            // pre-state
            PC,
            SP,
            ACC,
            REG_A,
            REG_B,
            REG_C,
            STACK_TOP,

            // opcode encoding (AIR core)
            OPCODE_ID,
            OP,
            ARG,

            // post-state
            PC_NEXT: nextPC,
            SP_NEXT: nextSP,
            ACC_NEXT: nextACC,
            REG_A_NEXT: nextA,
            REG_B_NEXT: nextB,
            REG_C_NEXT: nextC,
            STACK_TOP_NEXT
        });

        // commit state
        pc = nextPC;
        sp = nextSP;
        acc = nextACC;

        regA = nextA;
        regB = nextB;
        regC = nextC;
    }

    return { trace, acc, regs: { regA, regB, regC }, STACK, sp };
}

// -------------------------
// Test
// -------------------------
const program = `
CONST 8
SET 0
CONST 6
PUSH
GET 0
JSR
HALT
`;

const rom = parse(program);
const result = run(rom);

console.log("Final ACC:", result.acc);
console.log("Final REGS:", result.regs);

console.log("\nTrace sample:");
console.log(result.trace.slice(0, 3));
