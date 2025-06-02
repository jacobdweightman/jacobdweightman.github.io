---
layout: post
title:  "Solving Simple Tag Problems"
date:   2025-06-02 00:00:00 -0600
categories: computation
mathjax: true
---

This post is a continuation of my [last post on The Problem of Tag]({% post_url 2025-04-24-tag-systems %})
where I introduced a marble machine called a _tag system_, and the possible
behaviors they can have, namely _halting_, _looping_, and _diverging_. I also
talked about _the problem of tag_, which asks whether a particular tag system
operating on a particular starting sequence eventually halts, loops, or diverges.
I had also alluded to the fact that tag systems are Turing complete, which is
a really important "no-go" theorem when discussing the problem of tag -- in
particular, it means that there is no _fully general_ solution to the problem.
That is, there's no algorithm that always runs in a finite amount of time that
correctly decides which behavior a particular tag system has on a particular
string. I'm not going to actually prove this result here, but considering a very
naive approach gives some intuition of why this might be true. Consider an
algorithm that simulates the running of the tag system:

{% highlight python %}
class TagSystem:
    def __init__(self, v, rules):
        self.v = v
        self.rules = rules

def decide(T, A):
    while len(A) >= T.v:
        read = A[0]
        A = A[T.v:] + T.rules[read]
    return "halts"

T = TagSystem(2, [[2], [1, 0], [1, 1, 0]])
print(decide(T, [2, 2]))
{% endhighlight %}

With this approach, if $$T$$ halts on $$A$$, then the algorithm will always correctly
return `"halts"` (that is, this algorithm _recognizes_ halting strings). However,
if $$T$$ loops on $$A$$, then the algorithm will loop forever because... well... it
doesn't halt. Luckily, a tag system that loops will continue to revisit the same
finite set of strings at the same fixed interval over and over again, so we can
catch this by recording all the strings we see and returning "loops" if we ever
see the same one twice:

{% highlight python %}
def decide(T, A):
    seen = set()
    while len(A) >= T.v:
        if tuple(A) in seen:
            return "loops"
        seen.add(tuple(A))
        read = A[0]
        A = A[T.v:] + T.rules[read]
    return "halts"

T = TagSystem(2, [[2], [1, 0], [1, 1, 0]])
print(decide(T, [1, 0, 2]))
{% endhighlight %}

With this revision, we can recognize any string that halts or loops. The only
other possibility is that a string diverges, which is where we get stuck: how
can we distinguish a string that diverges from a string that loops? Well, a
diverging string eventually blows up in length, whereas a looping string is
transient for some number of steps before repeating strings. But is there a
reliable way to tell whether we're in the middle of the transient of a looping
string or diverging (potentially slowly)? We could try some different tricks,
but they'll all be confounded by the fact that some looping strings explode in
length by a lot before they loop, and some diverging strings grow really slowly.
Tag systems being Turing complete shows that this problem is impossible.

However, it _doesn't_ mean that the problem is never solvable, because
there are tag systems where it's not only possible, but actually easy. We've
already seen a nontrivial partial solution to the problem of tag: if one can
prove that a particular tag system never diverges, then the algorithm above
solves the problem of tag for it. At this point, you might wonder what sorts of
tag systems we can prove never diverge -- I'll answer that in a moment, but I'll
first suggest a detour to an even simpler tag system to analyze, which removes
two marbles from the machine and never inserts anything:

$$
\begin{cases}
\mathrm{remove}\, 2\, \mathrm{marbles} \\
R \rightarrow \epsilon \\
G \rightarrow \epsilon \\
B \rightarrow \epsilon
\end{cases}
$$

This tag system clearly halts. On every step, we take two marbles out and add
zero back in, and so the total number of marbles decreases by two. If we start
with `N` marbles, after $$\lfloor \frac{N}{2} \rfloor$$ steps we have less than
two marbles left, and halt. We can also concoct a similarly easy to analyze
tag system that usually loops:

$$
\begin{cases}
\mathrm{remove}\, 2\, \mathrm{marbles} \\
R \rightarrow GB \\
G \rightarrow BR \\
B \rightarrow RG
\end{cases}
$$

For any string of length less than two, this tag system has already halted. For
any other string, we take two marbles out and add two back in on every step.
Therefore, the total number of marbles stays the same at each step. For any
particular starting sequence of length $$N > 2$$, the length after any number of
steps is still $$N$$. Since there are finitely many strings of length $$N$$, by
the pigeonhole principle we eventually have to repeat one, and so this tag
system loops.

As a final motivating example before I actually state the next theorems,
consider this tag system that usually diverges:

$$
\begin{cases}
\mathrm{remove}\, 2\, \mathrm{marbles} \\
R \rightarrow RGB \\
G \rightarrow GBR \\
B \rightarrow BRG
\end{cases}
$$

As before, any string of length less than two has already halted. For any other
string, we take two marbles out and add three back in on every step. Therefore,
the total number of marbles _increases_ at each step. Therefore, this tag system
diverges on all such strings.

## Wang's Decidability Criteria

I definitely wasn't the first person to make these observations. Emil Post
alluded to these criteria in 1943, although the earliest detailed proof that I
found is from Hao Wang's 1963 paper, [Tag Systems and Lag Systems](https://doi.org/10.1007/BF01343730).
The following proofs stick very close to his, although they're a bit more
verbose and more closely follow my translation of the proofs into Lean.

<b>Theorem 1 (Wang's Halting Criterion):</b> For a tag system $$T = (v, \Sigma, \sigma)$$,
if the length of the appendant for all symbols is less than $$v$$, then the tag
system halts on all strings. Formally,

$$
(\forall a \in \Sigma, \left|\sigma(a)\right| < v) \rightarrow \forall A \in \Sigma^\ast, halts(T, A)
$$

<b>Proof:</b> Suppose that $$\left|\sigma(a)\right| < v$$ for any symbol $$a$$.
We proceed by strong induction on the length of $$A$$. Note that any string of
length less than $$v$$ has already halted, including the empty string. Now,
suppose that $$T$$ halts on any string strictly shorter than $$A$$, and that
$$v \le \left|A\right|$$. So we have that

$$ next(T, A) = drop (A \, \texttt{++} \, \sigma(head(A)), v) $$

And so

$$ \left|next(T, A)\right| = \left|A\right| + \left|\sigma(head(A))\right| - v < \left|A\right| $$

By the induction hypothesis, $$halts(T, next(T, A))$$, and therefore
$$halts(T, A)$$.
<p style="text-align:right; margin-top: -2em">□</p>



<b>Theorem 2 (Wang's Looping Criterion):</b> For a tag system $$T = (v, \Sigma, \sigma)$$,
if the length of the appendant for all symbols is precisely $$v$$, then $$T$$
halts on all strings shorter than $$v$$ and loops on all others. Formally,

$$
(\forall a \in \Sigma, \left|\sigma(a)\right| < v) \rightarrow \forall A \in \Sigma^\ast, \neg halted(T, A) \rightarrow loops(T, A)
$$

<b>Proof:</b> Suppose that $$\left|\sigma(a)\right| = v$$ for any symbol $$a$$,
and that $$T$$ hasn't halted on $$A$$. It follows from the latter that

$$ next(T, A) = drop (A \, \texttt{++} \, \sigma(head(A)), v) $$

And so

$$ \left|next(T, A)\right| = \left|A\right| + \left|\sigma(head(A))\right| - v = \left|A\right| $$

In fact, this doesn't depend on the particulars of $$A$$ beyond that $$T$$ isn't
halted on it, which is purely a function of its length. It follows by induction
that $$\left|next^i(T, A)\right| = \left|A\right|$$. There are finitely many
strings of length $$\left|A\right|$$, and so by the pigeonhole principle we have
$$i_1$$ and $$i_2$$ such that $$i_1 \ne i_2$$ and $$next^{i_1}(T, A) = next^{i_2}(T, A)$$.
Without loss of generality, suppose $$i_1 < i_2$$.

This gives us a loop: the transient length is $$i_1$$ and the period is
$$i_2 - i_1$$. To show that this is a loop, it must be that $$T$$ hasn't halted
after $$i_1$$ steps; to see this, note that $$T$$ hasn't halted on $$A$$, and
$$\left|next^{i_1}(T, A)\right| = \left|A\right|$$, so it also hasn't halted.
Next, we must demonstrate that the period is positive: since $$i_1 < i_2$$,
clearly $$0 < i_2 - i_1$$. Lastly, we must show that
$$next^{i_1}(T, A) = next^{i_2}(T, A)$$, but this was already shown by the
pigeonhole argument from earlier, which completes the proof.
<p style="text-align:right; margin-top: -2em">□</p>



<b>Theorem 3 (Wang's Divergence Criterion):</b> For a tag system $$T = (v, \Sigma, \sigma)$$,
if the length of the appendant for all symbols is greater than $$v$$, then $$T$$
halts on all strings shorter than $$v$$ and diverges on all others. Formally,

$$
(\forall a \in \Sigma, v < \left|\sigma(a)\right|) \rightarrow \forall A \in \Sigma^\ast, \neg halted(T, A) \rightarrow diverges(T, A)
$$

<b>Proof:</b> Suppose that $$v < \left|\sigma(a)\right|$$ for any symbol $$a$$,
and that $$T$$ hasn't halted on $$A$$. Now, note that for any $$A'$$ on which
$$T$$ hasn't halted (including $$A$$), we have that

$$ next(T, A') = drop (A' \, \texttt{++} \, \sigma(head(A')), v) $$

And so

$$ \left|next(T, A')\right| = \left|A'\right| + \left|\sigma(head(A'))\right| - v > \left|A'\right| $$

Next, after any number of steps $$i$$, we need to find another number of steps
$$j > i$$ such that we have an even longer string. $$j = i + 1$$ is such a choice:
clearly $$j > i$$, and taking $$A' = next^i(T, A)$$ we have that
$$\left|next^j(T, A)\right| > \left|next^i(T, A)\right|$$.
<p style="text-align:right; margin-top: -2em">□</p>


## Which tag systems does this let us decide?

At this point, we have a few tools in our tool belt for solving the problem of
tag: using Wang's criteria, we already have an answer for any tag system where
all of the rules put in less than $$v$$ marbles, exactly $$v$$ marbles, or more
than $$v$$ marbles. We also have the algorithm from earlier, where we can run
any non-diverging tag system until it either halts or repeats a string; together
with Wang's criteria, we can see that a tag system never diverges if all of its
rules put in no more than $$v$$ marbles, which allows us to solve the problem of
tag for an even larger class of tag systems.

Two useful complexity measures for tag systems used in the literature are the
deletion number, $$v$$, and alphabet size, $$\mu = \left|\Sigma\right|$$. These
classes are denoted $$\mathrm{TS}(\mu, v)$$. Intuitively, the higher the deletion number,
the more "state information" you can embed in the string, and similarly the more
symbols in the alphabet (or colors of marbles if you prefer), the more
expressive the transition function becomes. Therefore, one should expect that as
these numbers get higher, the more computationally powerful that class of tag
systems are. For example, Wang's decidability criteria alone are sufficient to
solve the problem of tag for any tag system in $$\mathrm{TS}(1, v)$$:

<b>Theorem 4 (Decidability of $$\mathrm{TS}(1, v))$$:</b> For a tag system
$$T = (v, \left\{a_1\right\}, \sigma)$$, the problem of tag is solvable.

<b>Proof:</b> Note that we have exactly one symbol in the alphabet, so we
trivially have that $$\forall a \in \Sigma, \sigma(a) = \sigma(a_1)$$. Let
$$ L \coloneq \left|\sigma(a_1)\right| $$. Now we have three cases:

_Case 1:_ suppose $$L < v$$. By theorem 1, we have $$halts(T, A)$$.

_Case 2:_ suppose $$L = v$$. By theorem 2, we have $$loops(T, A)$$.

_Case 3:_ suppose $$L > v$$. By theorem 3, we have $$diverges(T, A)$$.
<p style="text-align:right; margin-top: -2em">□</p>
